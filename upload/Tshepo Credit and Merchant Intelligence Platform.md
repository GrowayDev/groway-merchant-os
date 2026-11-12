# Tshepo: Credit and Merchant Intelligence Platform

**Architecture and Build Specification · v1.0 · Prepared for Groway (Pty) Ltd · 9 November 2026**

*Tshepo is a working name, pending trademark and linguistic review. This document supersedes the earlier 2050 concept and incorporates the gap analysis.*

## 1. Purpose, scope and status

**Purpose.** Define a buildable architecture, DevOps model and phased build plan for a credit decisioning, ledger and repayment platform owned by Groway, starting with Groway's own merchant, payment and connectivity ecosystem and extending to third-party partners.

**In scope.** South Africa first, Malawi second, with jurisdiction as configuration. Credit products, decisioning, ledger, repayment, collections, compliance services, lender and capital management, the SmartPole edge plane, operations tooling and the platform stack.

**Out of scope for build waves.** Quantum inference, QKD, CBDC settlement and causal graph inference are tracked on a research horizon with explicit triggers (section 14). Groway balance-sheet lending is a decision to be taken in Wave 0, not assumed.

**Status.** Architecture-level specification. Section 20 aligns it to the Groway source code and overrides sections 8, 9 and 15 where they conflict. Items marked *VERIFY* need confirmation by counsel, the regulator or an audit of existing Groway services before commitment.

## 2. What changed from the 2050 concept

| Earlier concept | This specification |
| --- | --- |
| Partner-first (MNO, ISP, utility) | First-party data first (Merchant OS, WiFi, Grant+, then GoPay once it is live), partners from Wave 3 |
| Kafka, Flink, Neo4j, Feast from day one | Lean core, with named scale triggers for each heavier component |
| Capital source unspecified | Capital and lender layer is a first-class component and a Wave 0 gate |
| Regulation treated as a cost line | Regulatory workstream with an owner, timeline and go/no-go gates |
| Edge plane built from scratch | SmartPole and Digital Hub nodes are the edge plane |
| Speculative 2050 technology in the build | Research horizon with triggers; crypto-agility and settlement abstraction kept |
| Unsourced market size and IRR | Bottom-up unit economics model specified in section 12 |
| Missing lifecycle components | KYC/AML, bureau, fraud, affordability, collections, disputes, back office, regulatory reporting added |

## 3. Design principles

1. **First-party data before partner data.** Prove underwriting on data Groway already owns.
2. **The ledger is the truth.** No partner balance or mutable column is authoritative.
3. **Consent is a runtime control**, enforced at ingestion and at inference, not a checkbox.
4. **Event-sourced core, lean infrastructure.** Design for events; deploy the simplest stack that meets the SLO.
5. **Every decision is explainable**, and every adverse decision has a reason and a human review path.
6. **Offline is first-class at the edge**, within conservative limits.
7. **Jurisdiction is configuration**: policy, limits, reporting and data residency are pluggable per country.
8. **Reuse before build.** Audit existing Groway services before writing new ones (section 15).
9. **Compliance as code**, enforced in CI/CD and at runtime.
10. **Scale triggers, not dates.** Heavier components are adopted when a measured threshold is crossed.

## 4. Product scope and sequencing

| Product | Segment | Repayment mechanism | Wave |
| --- | --- | --- | --- |
| Grant+ earned-wage access | SASSA grant recipients | DebiCheck / PayShap on grant day | 1 (pilot) |
| Merchant working capital | Merchant OS merchants | DebiCheck or PayShap collection through a licensed partner; GoPay settlement split once GoPay is live | 1–2 |
| Supplier credit | GroSupply buyers and sellers | Settlement netting against supplier payments | 2 |
| Connectivity advance | SmartPole WiFi users | Deduction from next purchase | 2 (small ticket, data-gathering) |
| Partner-sourced credit | Customers of MNO, ISP, utility partners | Partner-side repayment hooks | 3 |
| Malawi rollout | Merchants and WiFi users | Local rails and wallets | 3 |

The legal characterisation of Grant+ (earned-wage access versus credit) and the registered credit provider for each product must be confirmed before launch. *VERIFY*

**GoPay dependency.** GoPay is not yet live while its regulatory compliance processes are completed, so no Wave 1 deliverable depends on it. Wave 1 draws signals from Merchant OS, Grant+, WiFi and bureau data, and collects repayments through DebiCheck and PayShap via a licensed payment partner (for example Stitch or Adumo). Whether that route works for merchant working capital, or whether that product moves to Wave 2 behind GoPay, is a Wave 0 decision. GoPay data and its settlement split plug in after go-live. *VERIFY* which collection arrangements the partner and the regulators allow.

## 5. Alignment to the Sovereign Stack

| Sovereign Stack layer | Role in Tshepo |
| --- | --- |
| Energy | Solar and battery at SmartPoles keep edge nodes alive; node uptime is a monitored signal |
| Distributed compute | K3s edge nodes at hubs run the decision cache, offline origination and local inference |
| Connectivity | Pay-as-you-go WiFi is both a signal source and the sync path; satellite or LTE backup for sync |
| Sovereign data | In-country data residency, consent ledger, pseudonymised features, audit ledger |
| Application and intelligence | Origination, decisioning, ledger, repayment, collections, Mission Control agents |

## 6. Reference architecture

&#91;embedded content: full stack · 8 layers, ledger highlighted\]

Requests flow down through the gateway into the event-driven core, every service writes to the data layer, and edge nodes sync signed envelopes down and events up.

### 6.1 Channels and gateway

| Component | Specification |
| --- | --- |
| API gateway | Kong or APISIX; OpenAPI 3.x; OAuth 2.0 / JWT; schema validation; per-tenant rate limits |
| Identity | Keycloak (OIDC); customer, merchant, agent, partner and staff realms; MFA for staff and agents |
| Policy | OPA at the gateway and in the decision orchestrator; ABAC for tenant, role and purpose |
| Channels | Existing Merchant OS client, and the GoPay client once it is live; WhatsApp commerce layer; USSD and voice fallback; agent app with offline mode |
| Tenancy | Namespace-per-partner on Kubernetes; Postgres row-level security; lender-scoped views |

### 6.2 Consent and privacy service

- Append-only consent event store: grant, revoke, purpose, scope, expiry, jurisdiction.
- Purpose tokens checked by OPA at ingestion and at feature retrieval; revocation propagates to the feature store within one sync cycle (target under 5 minutes online, next sync at the edge).
- A signal collected for one purpose (for example WiFi billing) cannot feed underwriting without a new consent event.
- Data subject access, correction and deletion workflows are built here, not retrofitted. *VERIFY against POPIA and Malawi requirements.*

### 6.3 Signal ingestion

| Source | Mode | Wave |
| --- | --- | --- |
| Merchant OS sales and inventory | Internal events | 1 |
| GoPay transactions and settlements | Internal events (Stitch and Adumo rail data) | After GoPay go-live |
| Grant+ payment history | Internal events | 1 |
| SmartPole WiFi purchases and session data | Internal events from hub systems | 2 |
| Bureau data | API pull with consent | 1 |
| Partner MNO, ISP, utility | Webhook, polling or file-drop adapters, one container per protocol | 3 |

All sources pass through a normalisation step that validates against a Protobuf schema, tokenises PII, tags jurisdiction and purpose, and emits a unified temporal event.

### 6.4 Feature store

| Tier | Technology | Latency target | Contents |
| --- | --- | --- | --- |
| Hot | Redis | under 10 ms p99 | Latest behavioural features, current limits, session context |
| Warm | PostgreSQL (TimescaleDB if needed) | under 50 ms p99 | 7, 30 and 90 day aggregates, cohort deviations |
| Cold | Object storage with Iceberg tables, DuckDB or Trino | seconds to minutes | Training data, audit reconstruction |

Rule: every feature needed at decision time is precomputed. No synchronous external calls inside the decision path except bureau where contractually fast and cached.

### 6.5 Decisioning

| Component | Specification |
| --- | --- |
| Decision orchestrator | Event-driven service; consumes decision requests, fetches features, runs policy and models, emits decision and full trace; thin synchronous wrapper at the gateway using correlation IDs |
| Credit policy engine | Rules (GoRules or Drools) holding eligibility, hard stops, limits and pricing bands per product and jurisdiction; versioned and approved through change control |
| Affordability | Explicit affordability assessment step per product, with stored inputs and result; mandatory before any credit offer in regulated products *VERIFY NCA requirements* |
| Models | Start with scorecards and gradient-boosted models served via BentoML or KServe; champion/challenger with a 10% canary and a minimum observation window per product |
| Explainability | Reason codes from policy and model attributions; counterfactual guidance (what would change the outcome) delivered in plain language by every channel |
| Human review | Queue for declines above a value threshold, disputed outcomes and policy exceptions; reviewer decision is a ledgered event |
| Automated-decision rules | Where law restricts solely automated decisions, the review path and customer notice are enforced by policy *VERIFY POPIA s71* |

### 6.5.1 Risk and compliance services

| Service | Specification |
| --- | --- |
| KYC and AML | ID verification vendor integration, FICA-aligned risk rating, sanctions and PEP screening, ongoing monitoring, case management; goAML reporting hooks |
| Bureau | Integration with at least two bureaus; consented pulls, caching, and result storage; contributes repayment data back where permitted |
| Fraud | Device and behaviour signals, velocity rules, merchant collusion checks, synthetic identity checks; fraud decisions feed policy |
| Model registry | MLflow: model, dataset hash, feature set, validation report, approver, deployment record |

### 6.6 Credit lifecycle: ledger, repayment, collections, disputes

**Ledger.** Double-entry, append-only PostgreSQL with materialised balance views and an outbox table for event publication. Accounts per customer, product, lender, partner, fee and suspense. No mutable balance column is authoritative. Daily automated reconciliation against payment rails and lender statements, with exceptions routed to finance operations.

**Repayment engine.** Waterfall rules per product and jurisdiction, executed at the settlement boundary (for example a GoPay merchant settlement split) or at the instruction boundary (DebiCheck, PayShap). Supports partial payments, early settlement, reversal handling and compensating entries.

**Collections.** Arrears bucket workflow, outbound messaging via WhatsApp and SMS, promise-to-pay tracking, restructuring, hardship flags, and hand-over rules. Contact frequency and hours follow jurisdiction policy. Grant-linked products carry an affordability floor: repayment cannot reduce a recipient below a configured minimum retained amount.

**Disputes and complaints.** Case management with service-level clocks, ledger adjustments by approved reversal only, and complaint reporting to regulators as required.

### 6.7 Lender and capital management

| Capability | Specification |
| --- | --- |
| Lender onboarding | Lender profile, product allocation, risk appetite, limits and concentration caps |
| Capital allocation | Real-time exposure per lender, product and tenant; allocation rules route approved loans to funded lenders |
| Funding structures | Supports lender-funded, Groway-funded and warehouse-funded books; a decision in Wave 0 chooses the first structure |
| Reporting | Lender portfolio reports: vintages, roll rates, losses, yield, covenant tests |
| Settlement | Lender and platform fee settlement via ledger accounts, reconciled to bank |

### 6.8 Edge plane (SmartPoles and Digital Hubs)

| Component | Specification |
| --- | --- |
| Runtime | K3s on a hardened hub appliance; single Helm chart bundle; installable by a non-specialist in under 30 minutes with a validation suite |
| Decision cache | Signed eligibility envelopes (Ed25519 now, PQC-ready) with expiry and per-customer limits; validated locally |
| Offline origination | Local queue (SQLite or Postgres) capturing applications, repayments and consent events; conflict rules on sync; offline limits are conservative and capped |
| Local inference | ONNX Runtime for a simplified scorecard when the core is unreachable |
| Sync | MQTT or HTTPS batching over WiFi backhaul; LTE or satellite failover where available; disk-backed buffering |
| Power and health | Battery state, uptime and sync lag exported as metrics and used as a service-quality signal |
| Pilot | Seshego Digital Hub first, then a second hub to prove repeatability |

### 6.9 Operations and back office

- Staff portal: customer 360, case management, manual review queue, limit overrides with approval workflow, dispute handling.
- Finance operations: reconciliation workbench, suspense clearing, fee and lender settlement.
- Regulatory reporting: NCR, FIC and jurisdiction reports generated from the reporting mart with lineage back to ledger events.
- Mission Control: agent assistance for triage (document checks, reviewer summaries, collections drafts, compliance checks). Agents recommend; named staff approve. All agent actions are logged as events.

### 6.10 Data platform and reporting

- Event log is the integration backbone. Start with a managed or lightweight broker (Redpanda or a small Kafka cluster) when more than two consumers need ordered replay; before that, Postgres outbox plus a queue is acceptable.
- Batch pipelines orchestrated by Dagster or Airflow; dbt for reporting marts; lakehouse tables for training and audit.
- Data quality checks on every pipeline; reconciliation of ledger totals to marts as a daily control.

### 6.11 Security architecture

| Area | Specification |
| --- | --- |
| Encryption | TLS 1.3 in transit; AES-256 at rest; field-level encryption for PII; KMS-managed keys; HSM-backed signing keys for envelopes and tokens |
| Secrets | External Secrets Operator with Vault or cloud KMS; no secrets in Git |
| Network | Private endpoints, mTLS between services, network policies, egress allow-lists |
| PCI scope | Card data stays with Stitch or Adumo via tokenisation; Tshepo stores tokens only; scope documented and tested |
| Audit | Immutable audit table plus hash-chained export to object storage with retention and legal hold |
| Crypto-agility | Algorithm identifiers on every signature and token so PQC can be introduced by rotation, not rewrite |
| Testing | SAST, dependency and container scanning, SBOM, annual penetration test, pre-launch ledger and payments security review |

## 7. Core data model and event catalogue

**Principal entities:** Customer, Merchant, Agent, Partner, Lender, Account, Product, Offer, Application, Decision, Loan, LedgerEntry, RepaymentInstruction, Case, Consent, ModelVersion, PolicyVersion, Hub (edge node).

| Event | Producer | Key consumers |
| --- | --- | --- |
| consent.granted / consent.revoked | Consent service | Feature store, decisioning, audit |
| signal.normalised.{source} | Normalisation | Feature pipelines |
| application.submitted | Origination | KYC, fraud, decisioning |
| decision.made | Orchestrator | Origination, audit, reporting |
| loan.disbursed / loan.repaid / loan.written\_off | Ledger | Lender, collections, reporting |
| arrears.bucket\_changed | Collections | Notifications, policy |
| case.opened / case.resolved | Case management | Reporting |
| model.promoted / policy.changed | Registry / policy | Audit, monitoring |
| edge.synced | Edge agent | Ledger reconciliation, monitoring |

Events are Protobuf-defined with a schema registry. Every event carries tenant, jurisdiction, purpose token reference, correlation ID and a version.

## 8. Technology stack: start lean, scale on trigger

| Concern | Start with | Adopt when (trigger) |
| --- | --- | --- |
| Cloud | AWS af-south-1 or Azure South Africa North | Second country needs local residency: add region or in-country hosting |
| Orchestration | Managed Kubernetes | Edge fleet above about 10 nodes: add Fleet or Argo edge management |
| Event backbone | Postgres outbox plus queue, then Redpanda or Kafka | More than two ordered-replay consumers, or above about 1M events per day |
| Stream processing | Scheduled jobs and Kafka Streams | Feature freshness under 1 minute is a product need: add Flink |
| Feature store | Redis plus Postgres | More than about 500 features or multiple teams: add Feast |
| Models | Scorecards and GBMs, BentoML | More than about 20 production models: KServe and automated promotion |
| Graph | Postgres relationships | Relationship-based features measurably improve performance: pilot Neo4j |
| Service mesh | mTLS via Linkerd | Traffic-splitting needs beyond Argo Rollouts: evaluate Istio |
| Lakehouse | Object storage, Iceberg, DuckDB | Query concurrency or data volume exceeds DuckDB: add Trino |
| Languages | TypeScript on Node for every service, matching the Groway codebase; Prisma for data access; Python only for model training; edge agent also in TypeScript | Add another language only with a measured need and a recorded ADR |

## 9. DevOps and platform engineering

**Environments.** Separate cloud accounts for development, staging, production and security tooling. Production access is break-glass with approval and recording.

**Infrastructure as code.** Terraform with Terragrunt; Helm and Kustomize for applications; all changes via pull request.

**CI.** GitHub Actions or GitLab CI: build, unit and contract tests, SAST, dependency scan, container scan, SBOM, signed images, policy checks with Conftest.

**CD.** Argo CD (GitOps) with Argo Rollouts for canaries; automated rollback on SLO breach; database migrations through a controlled, reversible pipeline.

**Testing pyramid.** Unit, contract (Pact), integration against sandboxes (Stitch, Adumo, bureau, KYC), ledger property tests (balances always net to zero), replay tests from the event log, load tests to 3x expected peak, chaos tests on broker, database and edge sync, and quarterly disaster-recovery drills.

**Observability.** OpenTelemetry traces across request, features, model, policy and ledger; Prometheus and Grafana; Loki; alerting via Alertmanager to an on-call rota. Every decision trace is retained as audit evidence for the legally required period.

**SLOs (Wave 1 targets).**

| SLO | Target |
| --- | --- |
| Decision API p99 | under 500 ms (under 200 ms embedded target after Wave 2) |
| Decision success rate | 99.5% |
| Ledger write durability | zero loss; RPO under 1 minute |
| Core availability | 99.9% (99.95% after Wave 3) |
| RTO | under 4 hours |
| Daily ledger reconciliation | 100% completed, exceptions cleared within 2 business days |
| Edge sync lag | under 24 hours at 95% of hubs |

**FinOps.** Tagging by tenant and service, budget alerts, monthly cost review, unit cost per decision tracked as a metric.

**Edge DevOps.** Edge profile as a single Helm chart; models distributed as signed OCI artefacts; GitOps sync over intermittent links; Prometheus agent with remote-write and local buffering.

## 10. Regulatory and compliance specification

| Area | Requirement | Owner and gate |
| --- | --- | --- |
| Credit regulation (SA) | Determine whether Tshepo, the lender or both must be registered credit providers; affordability assessments; disclosures and statements; debt collection conduct | Compliance lead; gate before Wave 1 launch *VERIFY* |
| Payments (SA) | EMI and PSO scope for wallet and settlement activity; rail-partner obligations through Stitch and Adumo | Compliance lead; confirmed in Wave 0 *VERIFY* |
| Data protection | POPIA lawful basis, purpose limitation, cross-border transfer rules, automated decision restrictions, breach notification | Information officer; DPIA before Wave 1 |
| AML and KYC | FICA risk-based approach, sanctions screening, record keeping, suspicious transaction reporting | MLRO; programme approved before launch |
| Malawi | Licensing, data and credit rules to be mapped with local counsel before Wave 3 | Country lead *VERIFY* |
| Security assurance | ISO 27001 and SOC 2 readiness in Wave 2; PCI scope statement from Wave 1 | Security engineer |

Policy and compliance rules are expressed as code (OPA, policy engine) and every change passes review and is versioned.

## 11. Model risk management and responsible lending

**Model governance.** Each model has an owner, purpose, training data lineage, validation report, fairness assessment where lawful, monitoring plan and retirement criteria. No model reaches full traffic without an independent validation sign-off and a canary of at least one product cycle (7 days for short-term merchant products, 30 days for longer products).

**Monitoring.** Drift, approval and decline rates by segment, vintage performance, early-payment default, roll rates and override rates. Breaching a threshold automatically tightens limits and alerts the credit committee.

**Responsible lending guardrails.**

- Starter limits are small and increase only with demonstrated repayment.
- Over-indebtedness checks across Groway products and bureau data before any new offer.
- Grant-linked products enforce a minimum retained amount and a cap on total deductions.
- Plain-language terms, cost-of-credit disclosure and cooling-off information in the customer's language.
- Hardship and restructuring path available before any escalated collections.
- Quarterly outcome review of customer harm indicators (complaints, repeat rollovers, arrears curing) by the credit committee.

## 12. Business case specification (bottom-up)

The financial model replaces top-down market estimates. It must be built in Wave 0 and updated with pilot actuals.

| Input group | Variables |
| --- | --- |
| Volume | Eligible customers or merchants by segment, take-up rate, average ticket, loans per year |
| Credit | Probability of default by product and vintage, loss given default, recovery rate, time to write-off |
| Funding | Lender cost of funds, advance rate, first-loss structure, capital required per rand of book |
| Revenue | Origination fee, interest share, settlement fee, SaaS or licence fee, partner revenue share |
| Costs | Cloud and edge costs, bureau and KYC cost per check, collections cost, compliance, staffing, support |
| Outputs | Contribution margin per loan, breakeven default rate, cash need by month, payback, sensitivity to PD, take-up and cost of funds |

The model must show a breakeven default rate per product and a downside case. Investor materials quote only figures derived from this model and from pilot data.

## 13. Build plan

Each wave ends with a deployable, tested increment and a go/no-go gate. Durations are indicative and assume a small core team using AI-augmented development for scaffolding and tests, with mandatory human review for the ledger, security, credit policy and compliance code.

### Wave 0: Foundations and gates (months 0 to 3)

| Deliverable | Definition of done |
| --- | --- |
| Regulatory route confirmed | Written legal position on credit provider, EMI/PSO and POPIA roles; licensing plan |
| Lender and funding structure | Signed term sheet with at least one lender or funding source |
| Reuse audit | Inventory of existing Groway services against section 15; build/reuse decisions recorded |
| Bottom-up model v1 | Section 12 model with base and downside cases |
| Data and consent design | DPIA, consent taxonomy, event schemas |
| Credit policy v0 | Grant+ and merchant working capital policy, limits, affordability method |
| Team and landing zone | Accounts, Terraform baseline, CI skeleton |

**Gate:** counsel confirms the regulatory route and a lender term sheet is signed. If not, Wave 1 does not start.

### Wave 1: Lean core and first-party pilot (months 3 to 9)

| Deliverable | Definition of done |
| --- | --- |
| Gateway, identity, tenancy | Multi-realm Keycloak, OPA policies, tenant isolation tests passing |
| Consent service | Grant, revoke, purpose enforcement end to end |
| Ledger v1 | Double-entry, outbox, daily reconciliation, property tests |
| Signal ingestion | Merchant OS, Grant+ and WiFi events normalised; GoPay added after go-live |
| Feature store | Redis hot and Postgres warm tiers with 30 to 60 features |
| Decision orchestrator and policy | Event-driven, traced, reason codes, human review queue |
| KYC, AML, bureau, fraud v1 | Vendor integrations in sandbox then production |
| Repayment engine v1 | DebiCheck and PayShap collection through a licensed partner; GoPay settlement split added after go-live |
| Collections and disputes v1 | Arrears workflow, messaging, case management |
| Back office v1 | Staff portal, reconciliation workbench |
| Observability and SRE | SLO dashboards, on-call, runbooks, DR plan tested once |
| Pilot | Limited cohort of merchants and Grant+ users with strict exposure caps |

**Gate:** pilot loss rate within the base-case threshold for two full vintages, reconciliation clean for 30 days, zero critical security findings.

### Wave 2: Edge, second product and assurance (months 9 to 15)

| Deliverable | Definition of done |
| --- | --- |
| Edge bundle | K3s hub bundle with signed envelopes, offline origination, sync and bootstrap script |
| Seshego hub pilot, then second hub | Offline decisions and repayments reconciled with no unexplained variance |
| SmartPole WiFi signals | Purchase and session features in production with consent |
| Supplier credit and connectivity advance | Policies approved, pilots live |
| Champion/challenger | At least two models per product with canary promotion |
| Lender reporting | Portfolio dashboards and covenant reports |
| ISO 27001 and SOC 2 readiness | Gap assessment closed, evidence collected continuously |

**Gate:** edge installation by a non-specialist succeeds, and lender funding scales beyond pilot limits.

### Wave 3: Partners and Malawi (months 15 to 24)

| Deliverable | Definition of done |
| --- | --- |
| Partner adapter kit | Webhook, polling and file-drop adapters, sandbox, onboarding guide |
| Two external partners live | Signal, consent and repayment hooks working in production |
| Malawi jurisdiction pack | Policy, limits, reporting and residency configured; local legal sign-off |
| Scale improvements | Event backbone, Flink or Feast adopted only if triggers in section 8 are met |

### Research horizon (triggers, not dates)

| Item | Trigger |
| --- | --- |
| Causal and graph inference | Relationship features show measurable lift in challenger tests on live data |
| CBDC or stablecoin settlement | A regulated production rail in an operating market, with a partner asking for it |
| Post-quantum migration | Standards and vendor support mature, or regulator guidance; crypto-agility already in place |
| Quantum optimisation | A clear portfolio-optimisation problem classical methods cannot solve economically |

## 14. Team and operating model

| Role | Wave 0 | Wave 1 | Wave 2 to 3 |
| --- | --- | --- | --- |
| Architect / technical lead | 1 | 1 | 1 |
| Compliance and risk lead | 1 | 1 | 1 to 2 |
| Credit and product lead | 1 | 1 | 2 |
| Backend engineers | 1 | 4 to 5 | 6 to 8 |
| Data and ML engineers | 0 | 2 | 3 to 4 |
| Platform / SRE | 1 | 2 | 3 |
| Security | 0 | 1 | 1 to 2 |
| Edge and network engineer | 0 | 0 to 1 | 2 |
| QA and test automation | 0 | 1 | 2 |
| Operations and collections | 0 | 2 | 4 to 6 |

Operating rules: trunk-based development, feature flags, weekly releases, four-eyes review on ledger, policy and security code, a monthly credit committee, and a change advisory step for any production policy or model change.

## 15. Reuse versus build register (to complete in Wave 0)

| Capability | Existing Groway asset to assess | Default decision |
| --- | --- | --- |
| Wallet and payments | GoPay, Stitch and Adumo routing | Reuse once GoPay is live and licensed; until then integrate Stitch and Adumo directly |
| Merchant data | Merchant OS | Reuse as primary signal source |
| Commerce events | WhatsApp commerce layer, GroSupply | Reuse as signal source and channel |
| Grant product | Grant+ | Extend with decisioning and ledger |
| Identity and users | Existing microservices (about 35) | Audit; reuse if it meets security and consent needs |
| Ledger | Any existing GoPay ledger | Reuse only if double-entry, append-only and reconcilable; otherwise build Tshepo ledger and migrate |
| Hub systems | SmartPole and WiFi billing | Integrate; add edge bundle |
| Ops automation | Mission Control | Reuse for agent-assisted workflows |

## 16. Principal risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Regulatory route unclear or changes | Wave 0 gate; counsel retained; jurisdiction-pluggable policy |
| No lender or capital | Wave 0 gate; staged exposure caps; DFI and bank conversations in parallel |
| High early losses | Small starter limits, vintage monitoring, automatic limit tightening, pilot caps |
| Customer harm in grant and low-income segments | Section 11 guardrails; credit committee review; hardship paths |
| Over-engineering delays launch | Lean stack with explicit triggers; scope reviews each wave |
| Ledger or reconciliation errors | Property tests, daily reconciliation, four-eyes review, staged rollout |
| Edge nodes fail or drift | Bootstrap script, health metrics, conservative offline limits, remote rollback |
| Key-person and vendor dependency | Documented runbooks, multi-vendor KYC and bureau, escrowed configuration |
| Data breach | Field encryption, least privilege, tokenised PII, tested incident plan |
| Brand or name conflict | CIPC trademark and domain search before public use of Tshepo |

## 17. Open decisions and immediate next steps

1. Confirm the name (Tshepo or alternative) and complete trademark and meaning review.
2. Decide the first funding structure: lender-funded, Groway-funded or warehouse.
3. Commission the legal opinion on credit provider, EMI/PSO and POPIA roles.
4. Run the reuse audit against existing Groway services and fill in section 15.
5. Build the bottom-up model (section 12) and agree pilot exposure caps.
6. Select KYC, bureau and fraud vendors for sandbox integration.
7. Appoint the compliance lead and credit committee.
8. Choose the second Digital Hub for the Wave 2 edge pilot.

## 18. Build guide

This guide turns the architecture into a build order an engineering team can execute. Start only after the Wave 0 gates in section 13 pass. Schemas and snippets are illustrative: align them with existing Groway conventions found in the reuse audit.

### 18.1 Repository and service layout

```text
tshepo/
  contracts/        Protobuf events, OpenAPI specs, policy schemas (source of truth)
  services/
    gateway-config/ routes, rate limits, schema validation
    consent/        consent events, purpose tokens
    ingest/         one adapter per source (merchant-os, gopay, grantplus, wifi, partner-*)
    features/       stream and batch feature jobs, feature definitions
    decisioning/    orchestrator, policy engine bindings, reason codes
    origination/    applications, offers, acceptance
    ledger/         double-entry ledger, outbox
    repayment/      waterfall engine, settlement adapters
    collections/    arrears workflow, messaging
    cases/          disputes, complaints, manual review
    capital/        lenders, exposure, allocation
    kyc-risk/       KYC, bureau, fraud wrappers
    notify/         SMS, WhatsApp, USSD
    reporting/      marts, regulatory and lender reports
  models/           training pipelines, validation reports, registry config
  edge/             hub bundle: Helm chart, agent, bootstrap script
  platform/         Terraform, Helm, Argo CD apps, OPA policies, dashboards
  docs/             ADRs, runbooks, data protection impact assessment
```

Each service owns its data: no service reads another service's tables. Changes under `contracts/` need two reviewers.

### 18.2 Engineering standards

| Area | Standard |
| --- | --- |
| Contracts first | Write the Protobuf or OpenAPI definition before the code; a breaking change needs a new version |
| Money | Integer minor units plus ISO currency code; never floating point |
| Identifiers | UUIDv7 for entities; a correlation ID on every request and event |
| Time | UTC everywhere; local time only at display |
| Idempotency | Every write endpoint and event consumer is idempotent by key; a duplicate is a no-op |
| Outbox | A state change and its event are committed in one transaction through the outbox table |
| Errors | Typed error codes; no personal data in errors or logs |
| Personal data | Tokenised at ingestion; raw identifiers live only in the identity vault and KYC service |
| Migrations | Forward-only, run by the pipeline before deploy; undone by a compensating migration, never by editing history |
| Feature flags | Every new product, policy and model sits behind a flag scoped by tenant |
| Configuration | Policy, limits and pricing are versioned data, not constants in code |
| Observability | Every handler emits a trace span and the standard metrics; decision traces are retained as audit evidence |
| Testing | Unit, contract and integration tests on every service; property tests on the ledger |
| Review | Four-eyes review on ledger, repayment, credit policy, consent, security and contract changes |

### 18.3 Rules for AI-assisted development

AI tools are used for scaffolding, adapters, test generation, documentation and refactors. The rules keep that speed from weakening the controls.

- Generated code passes the same pipeline and review as written code.
- Named humans own and review ledger, repayment, credit policy, consent, cryptography and any migration touching money.
- No secrets and no real customer data go into prompts.
- Generated tests are reviewed for what they assert, not only for coverage.
- A pull request that contains a substantial generated module says so and links the prompt used.

### 18.4 Build sequence

Steps 2 to 5 can run in parallel once step 1 is done. Each step ends in a deployable increment.

| Step | Build | Depends on | Done when |
| --- | --- | --- | --- |
| 1 | Landing zone and pipeline: accounts, Terraform, cluster, CI/CD, secrets | Wave 0 gates | A sample service deploys through GitOps to staging with scans passing |
| 2 | Contracts and event schemas: event catalogue, schema registry, OpenAPI | 1 | Contracts are versioned and contract tests run in CI |
| 3 | Gateway and identity: gateway, Keycloak realms, OPA baseline | 1 | A cross-tenant request is rejected by an automated test |
| 4 | Consent service: event store, purpose tokens, revocation | 2, 3 | A revocation blocks feature reads within the target time |
| 5 | Ledger: schema, posting API, outbox, balance views, reconciliation job | 2 | Property tests show every entry nets to zero; replaying the log rebuilds balances |
| 6 | Ingestion adapters: Merchant OS, Grant+, WiFi (GoPay after go-live) | 2, 4 | Source events appear normalised and consent-tagged |
| 7 | Feature store: Redis hot tier, Postgres warm tier, feature definitions | 6 | Features are served under 20 ms p99 on staging load |
| 8 | Decisioning: orchestrator, policy engine, first scorecard, reason codes, traces | 4, 7 | A decision returns reasons and a full trace; a decline returns counterfactual text |
| 9 | KYC, bureau, fraud and affordability integrations | 3, 8 | Sandbox checks gate origination |
| 10 | Origination and repayment: offers, disbursement, waterfall, DebiCheck and PayShap through a licensed partner (GoPay split after go-live) | 5, 8, 9 | A sandbox loan disburses and repays with a correct ledger |
| 11 | Collections, cases and notifications | 10 | An arrears bucket change triggers a compliant message and a case |
| 12 | Back office and reporting: staff portal, reconciliation workbench, reports | 5, 10, 11 | Finance closes a day with zero unexplained variance |
| 13 | Hardening: SLO dashboards, runbooks, restore test, penetration test | All above | The disaster-recovery drill passes with no critical findings |
| 14 | Pilot release behind flags | 13 | The Wave 1 pilot gate in section 13 is met |

&#91;embedded content: build dependencies · 14 steps, critical path in accent\]

Gateway (step 3) and ledger (step 5) are off the critical path, so start them in parallel with the contracts. The rest of the chain is sequential, and the GoPay settlement split drops into step 10 once GoPay is live.

### 18.5 Blueprints for the critical components

**Ledger schema (illustrative).**

```sql
CREATE TABLE account (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  kind text NOT NULL,          -- customer, merchant, lender, fee, suspense, platform
  currency char(3) NOT NULL,
  owner_ref text NOT NULL      -- tokenised reference, never raw personal data
);
CREATE TABLE journal_entry (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  idempotency_key text NOT NULL,
  posted_at timestamptz NOT NULL DEFAULT now(),
  reason text NOT NULL,        -- disbursement, repayment, fee, reversal, write-off
  correlation_id uuid NOT NULL,
  UNIQUE (tenant_id, idempotency_key)
);
CREATE TABLE ledger_line (
  id uuid PRIMARY KEY,
  entry_id uuid NOT NULL REFERENCES journal_entry(id),
  account_id uuid NOT NULL REFERENCES account(id),
  amount_minor bigint NOT NULL, -- signed: debit positive, credit negative
  currency char(3) NOT NULL
);
CREATE TABLE outbox (
  id uuid PRIMARY KEY,
  topic text NOT NULL,
  payload bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);
```

Invariants to enforce and test:

- The lines of every entry sum to zero per currency, enforced by a deferred constraint and by a property test.
- The application role has no UPDATE or DELETE rights on `journal_entry` and `ledger_line`; a correction is a new reversing entry.
- Balances are derived from lines, never stored as the source of truth.
- The entry and its outbox row commit in one transaction.
- Write a pending entry before calling a payment rail and settle it on confirmation, so a timeout never leaves money unrecorded.

**Decision flow.**

1. The gateway authenticates the caller, checks tenant and purpose, stamps a correlation ID and publishes a decision request.
2. The orchestrator checks a valid consent token for every feature group it needs.
3. It fetches features from the hot tier, then the warm tier; a missing critical feature means refer to review, never guess.
4. Hard-stop policy runs first: KYC status, fraud flags, limits and over-indebtedness.
5. The affordability assessment runs and its inputs and result are stored.
6. The model runs, then policy applies the limit and pricing bands.
7. Reason codes and the counterfactual text are built for every adverse outcome.
8. The orchestrator emits the decision with its trace and the policy, model and feature-set versions.
9. Origination presents the offer; declines above the value threshold go to the human review queue.

**Edge decision envelope (illustrative).**

```json
{
  "envelope_id": "uuidv7",
  "subject": "customer-token",
  "tenant": "tenant-id",
  "product": "merchant-working-capital",
  "max_offline_amount_minor": 50000,
  "currency": "ZAR",
  "valid_from": "2026-11-01T00:00:00Z",
  "expires_at": "2026-11-08T00:00:00Z",
  "policy_version": "p-0.3.1",
  "model_version": "m-0.2.0",
  "alg": "Ed25519",
  "kid": "key-2026-11",
  "signature": "base64"
}
```

The edge node verifies the signature, expiry, tenant and key ID before every use, tracks offline spend locally against the cap, and reports it on sync. The core reconciles that spend and can revoke an envelope. Keep expiry short and offline caps small until the first hubs show clean reconciliation.

**Repayment waterfall tests.** The order of allocation is product configuration approved by compliance. Test at least: partial payment, overpayment, early settlement, reversal of a payment, two payments arriving together, and a rail timeout followed by a late confirmation.

### 18.6 Week-one setup checklist

- [ ] Create cloud accounts for development, staging, production and security tooling
- [ ] Set up Terraform remote state and the baseline network
- [ ] Stand up managed Kubernetes in development and staging with Argo CD
- [ ] Build the CI pipeline: build, test, scan, SBOM, image signing
- [ ] Connect secrets through External Secrets and Vault or cloud KMS
- [ ] Apply baseline admission policies: no latest tags, resource limits, no privileged containers
- [ ] Deploy OpenTelemetry, Prometheus, Grafana and Loki
- [ ] Create the contracts repository and schema registry
- [ ] Obtain sandbox access to Stitch, Adumo, a bureau and a KYC vendor
- [ ] Set up the on-call rota and an incident channel
- [ ] Write the ADR template and the first ADRs: stack choices, tenancy model, money type

### 18.7 Quality gates

| Gate | When | Blocks |
| --- | --- | --- |
| Lint, unit and contract tests | Every pull request | Merge |
| Dependency and container scan with no high findings | Every pull request | Merge |
| Policy checks (Conftest, admission rules) | Every pull request | Merge |
| Ledger property tests | Any change to ledger or repayment | Merge |
| Integration tests against sandboxes | Release candidate | Release |
| Load test at 3 times expected peak | Release candidate | Release |
| Migration dry run on a staging copy | Release candidate | Release |
| Security review of authentication and money-moving changes | Release candidate | Release |
| Canary at 10% with SLO watch | Release | Full rollout |
| Rehearsed rollback | Before each pilot stage | Pilot stage |

### 18.8 Pilot go-live checklist

- [ ] Legal opinion and any registrations in place
- [ ] Lender agreement signed, funds confirmed, exposure caps configured
- [ ] Data protection impact assessment complete; privacy notice and consent wording approved
- [ ] Credit policy and affordability method approved by the credit committee
- [ ] Disclosures, terms and statements reviewed for the product
- [ ] KYC and AML programme live with a named MLRO
- [ ] Reconciliation clean for 30 consecutive days
- [ ] Disaster-recovery drill and rollback tested
- [ ] Penetration test with critical and high findings closed
- [ ] Runbooks written and rehearsed
- [ ] Support team trained and the complaints route live
- [ ] Pilot cohort, exposure caps and stop-loss triggers agreed
- [ ] Kill switch tested per product and per tenant

### 18.9 Runbooks to write before launch

| Runbook | First action |
| --- | --- |
| Ledger imbalance or failed reconciliation | Freeze new disbursements; identify the entry or rail event |
| Payment rail outage or timeout | Switch to pending-only mode; stop disbursements on that rail |
| Decision latency breach | Check feature store and model serving; fall back to cached limits |
| Model drift alert | Tighten limits automatically; page the credit lead |
| Consent revocation backlog | Block affected feature reads; clear the queue |
| Edge node offline or out of sync | Expire its envelopes; reconcile on reconnect |
| Suspected data breach | Contain, preserve evidence, start the notification clock with the information officer |
| Fraud spike | Tighten fraud rules; suspend affected merchants or channels |
| Key compromise or rotation | Revoke key ID; reissue envelopes and tokens |
| Customer or regulator data request | Log it, verify identity, assemble from the audit trail within the legal deadline |

### 18.10 Common build traps

- Building the staff portal or the app flows before the ledger exists.
- Storing a mutable balance and treating it as truth.
- Treating consent as a checkbox instead of a runtime check.
- Letting training features use information not available at decision time; build point-in-time features.
- Sharing one database between services.
- Writing policy and limits as constants in code.
- Skipping idempotency on payment rail callbacks, which are delivered more than once.
- Setting edge limits generously because the first pilot looks safe.
- Treating the pilot as a demo: it carries real customers, so every item in 18.8 applies.

## 19. Delivery backlog (Wave 1)

One story per row, grouped by build step from section 18.4. Stories marked GoPay wait for go-live and stay out of the Wave 1 pilot scope. Sizing and assignment are left to the team after the reuse audit.

| ID | Story | Step | Depends on |
| --- | --- | --- | --- |
| T-01 | Create cloud accounts, organisation policies and baseline network in Terraform | 1 | None |
| T-02 | Provision managed Kubernetes for dev and staging; install Argo CD | 1 | T-01 |
| T-03 | CI pipeline: build, test, scan, SBOM, signed images | 1 | T-01 |
| T-04 | Secrets through External Secrets with Vault or KMS | 1 | T-02 |
| T-05 | Admission policies and baseline OPA rules | 1 | T-02 |
| T-06 | Observability baseline: OpenTelemetry, Prometheus, Grafana, Loki | 1 | T-02 |
| T-07 | Event envelope and event catalogue in Protobuf | 2 | T-03 |
| T-08 | Schema registry and compatibility checks in CI | 2 | T-07 |
| T-09 | OpenAPI specs for partner, merchant and staff APIs | 2 | T-07 |
| T-10 | Gateway with schema validation and rate limits | 3 | T-02 |
| T-11 | Keycloak realms for customer, merchant, agent, partner and staff; MFA for staff and agents | 3 | T-02 |
| T-12 | Tenant claim, namespace-per-tenant and row-level security pattern | 3 | T-10, T-11 |
| T-13 | Cross-tenant isolation test suite | 3 | T-12 |
| T-14 | Consent event store and purpose taxonomy | 4 | T-07, T-12 |
| T-15 | Purpose-token issuing and OPA enforcement | 4 | T-14 |
| T-16 | Revocation propagation with a measured latency test | 4 | T-15 |
| T-17 | Data subject access and deletion workflows | 4 | T-14 |
| T-18 | Ledger schema, constraints and role grants | 5 | T-07 |
| T-19 | Posting API with idempotency keys | 5 | T-18 |
| T-20 | Outbox publisher | 5 | T-18 |
| T-21 | Property tests: entries net to zero, replay rebuilds balances | 5 | T-19 |
| T-22 | Daily reconciliation job and exceptions queue | 5 | T-19 |
| T-23 | Normalisation service: schema validation, PII tokenisation, jurisdiction tag | 6 | T-07, T-15 |
| T-24 | Merchant OS adapter | 6 | T-23 |
| T-25 | Grant+ adapter | 6 | T-23 |
| T-26 | SmartPole WiFi purchase adapter | 6 | T-23 |
| T-27 | GoPay adapter | 6 | T-23, GoPay go-live |
| T-28 | Feature definitions and the first 30 to 60 features | 7 | T-24, T-25 |
| T-29 | Hot-tier (Redis) writer and reader | 7 | T-28 |
| T-30 | Warm-tier (Postgres) aggregates | 7 | T-28 |
| T-31 | Point-in-time feature extraction for training | 7 | T-30 |
| T-32 | Orchestrator that consumes requests and emits decisions with traces | 8 | T-15, T-29 |
| T-33 | Policy engine bindings and policy versioning | 8 | T-32 |
| T-34 | First scorecard trained, validated and registered | 8 | T-31 |
| T-35 | Reason codes and counterfactual text in the customer's language | 8 | T-32 |
| T-36 | Human review queue | 8 | T-32 |
| T-37 | KYC vendor integration and risk rating | 9 | T-11, T-32 |
| T-38 | Sanctions and PEP screening | 9 | T-37 |
| T-39 | Bureau integration with consented pulls and caching | 9 | T-15 |
| T-40 | Fraud rules v1 | 9 | T-32 |
| T-41 | Affordability assessment step with stored inputs | 9 | T-32 |
| T-42 | Offer and acceptance flow | 10 | T-36, T-41 |
| T-43 | Disbursement through a licensed payment partner | 10 | T-19 |
| T-44 | DebiCheck and PayShap collection through a licensed partner | 10 | T-19 |
| T-45 | Repayment waterfall engine and test cases | 10 | T-19 |
| T-46 | Lender allocation and exposure caps | 10 | T-19 |
| T-47 | GoPay settlement split | 10 | T-45, GoPay go-live |
| T-48 | Arrears buckets and collections workflow | 11 | T-45 |
| T-49 | Customer messaging through the notifications service | 11 | T-48 |
| T-50 | Disputes and complaints case management | 11 | T-19 |
| T-51 | Hardship and restructuring path | 11 | T-48 |
| T-52 | Staff portal: customer view, review queue, limit overrides with approval | 12 | T-36, T-50 |
| T-53 | Reconciliation workbench | 12 | T-22 |
| T-54 | Lender portfolio reports | 12 | T-46 |
| T-55 | Regulatory report generation with lineage to ledger events | 12 | T-22 |
| T-56 | SLO dashboards, alerts and on-call rota | 13 | T-06 |
| T-57 | Runbooks listed in section 18.9 | 13 | Steps 1 to 12 |
| T-58 | Disaster-recovery restore drill | 13 | Steps 1 to 12 |
| T-59 | Penetration test and fixes | 13 | Steps 1 to 12 |
| T-60 | Load test at 3 times expected peak | 13 | Steps 1 to 12 |
| T-61 | Feature flags, exposure caps and kill switches | 14 | T-46 |
| T-62 | Pilot cohort selection and customer communications | 14 | T-61 |
| T-63 | Daily pilot dashboard: losses, arrears, complaints, reconciliation | 14 | T-56 |

## 20. Alignment to the Groway source (final defining spec)

This section is based on the Groway source archive and overrides sections 8, 9 and 15 where they conflict. The older Master Build file describes about 35 microservices with a React Native app. The source does not contain that: it is a single Next.js application. Tshepo is therefore built as a **modular monolith inside the Groway repository**, with clean ports so any module can be extracted later.

### 20.1 What the source shows

| Finding in the source | What it means for Tshepo |
| --- | --- |
| Next.js 16, React 19, TypeScript, Prisma 6, one repository; 684 API route handlers; 296 models in the development schema | Tshepo is TypeScript modules under `src/lib/tshepo` with route handlers under `src/app/api/tshepo`, tested with the repo's jest setup |
| Development uses SQLite; the Postgres schema has only 62 models against 296 | The Postgres file is stale and unused (section 21). Convert the 296-model schema to Postgres instead; the ledger guards need Postgres |
| Money is stored as floating point in GoPay, GroCredit, accounting and consumer loan models; only `ConsumerWallet` uses integer cents | Tshepo ledger uses integer minor units. Legacy float tables become read-only mirrors; new money movements are written to the ledger first |
| The accounting `JournalEntry` uses floats, string dates and has no idempotency or tenant key | Keep it for accounting. Tshepo has its own ledger, linked by source type and source ID, and posts summary entries to accounting |
| GoPay models (merchant, device, transaction, settlement, repayment, lending facility, loan application) have no tenant key and no ledger | Add a tenant key and post every settlement and repayment through the Tshepo ledger |
| GroCredit already exists: credit tiers with NCA flags, merchant credit, applications, draw requests, repayments, and seven API routes | Tshepo does not create a second credit product. Decisioning takes the tiers as policy input and the ledger records the money |
| Consumer lending shells already exist: consumer loans, earned wage access, BNPL, layby, grant routes, credit score, KYC documents | Reuse as product shells on the same ledger and decision engine |
| Tenancy is `PlatformTenant` plus `merchantId`, with an async tenant context; only about 22 files reference a tenant ID; the security audit reports about 95% of critical issues fixed | Verify isolation on every Tshepo route before multi-tenant lending. Do not assume it |
| Existing services: fraud detection, audit log, SMS, notifications, Redis, Sentry, POPIA routes | Reuse for fraud checks, audit, collections messages, caching and error reporting |
| Authentication is NextAuth v4 with JWT; deployment is Docker, Caddy and Netlify scripts | Keep. Keycloak, OPA at the gateway and Kubernetes are removed from Waves 1 and 2 |

### 20.2 Revised stack (replaces sections 8 and 9 for Waves 1 and 2)

| Concern | Decision |
| --- | --- |
| Language and framework | TypeScript; Next.js route handlers; Tshepo domain code in plain TypeScript modules with ports |
| Data | Postgres through Prisma; raw SQL guards for balance, append-only and non-zero rules |
| Events | Postgres outbox with a worker that publishes; add a broker only when a scale trigger in section 8 is met |
| Features | Postgres tables plus the existing Redis client; no separate feature store service |
| Models | Scorecards and rules in TypeScript; Python only for offline training |
| Identity and permissions | NextAuth, JWT and the existing permissions module; a consent check inside the decision module |
| Tests and CI | Jest (existing); ledger property tests; contract tests on route handlers |
| Deployment | Existing Docker deployment; staging and production databases separated |
| Observability | Sentry (existing), structured logs with a correlation ID on every request, OpenTelemetry later |
| Edge | A small Node agent, packaged for the hub appliance |

### 20.3 Delivered so far

The zip `tshepo-groway-integration` lays out as `src/lib/tshepo`, `__tests__/tshepo`, a Prisma model fragment and SQL guards, matching the repo.

| Item | Status |
| --- | --- |
| Ledger, consent, waterfall, GoPay settlement, decisioning, edge envelopes | Built, typechecked, 24 tests passing |
| Prisma ledger adapter | Built; tested against a fake client only, not a database |
| Tshepo Prisma models | Merged with Groway's Postgres schema and checked with the Prisma 6 schema validator: valid |
| SQL guards (balanced entries, non-zero lines, append-only) | Written, not yet run on a database |
| Jest run inside the real Groway repo | Not done; dependencies were not installed |

### 20.4 Consumer wallet: retained from the older build file

The consumer wallet was removed from Groway's final specification, so it is **not in Wave 1 or Wave 2 scope**. It stays in the Tshepo design, taken from section 2 of the older Master Build and the consumer wallet summary, so nothing in the ledger has to change when it returns.

| Area | From the older build file | Tshepo treatment |
| --- | --- | --- |
| Wallet core | Multi-currency wallet, savings pockets, stokvel group savings, history and export, disputes, spending limits | Ledger account kind `consumer_wallet`, with limits and KYC levels 0 to 4 as policy |
| Payments | QR, P2P, PayShap, request and split, scheduled payments, beneficiaries, offline token | Payments post through the same settlement flow as merchant sales; offline tokens reuse the signed-envelope design |
| Financial services | Bills, airtime, remittance, vouchers, ticketing, prepaid electricity | Product adapters behind licensed partners |
| Credit | Credit score, BNPL, earned wage access, layby | Existing consumer shells on the Tshepo decision engine; repayment can be taken from the wallet as a waterfall source |

The existing `ConsumerWallet` model already uses integer cents, so it can map to the ledger without conversion. Holding customer funds is a regulated activity: the licensing route (own licence or a licensed partner) must be settled with GoPay's compliance work before the wallet comes back. *VERIFY*

I reviewed the wallet categories listed above in the older feature matrix; the full matrix of 42 features should be walked through when the wallet is scheduled.

### 20.5 Changes to the build sequence and backlog

| Change | Affects |
| --- | --- |
| New step 0: convert the 296-model development schema to Postgres (the 62-model file is stale), stand up Postgres on the Mac server and baseline the migrations (section 21) | Before step 1 |
| New: add a tenant key to GoPay tables; write all settlements through the ledger; keep float columns read-only | Steps 6 and 10 |
| Replace the Kubernetes landing zone with the existing Docker deployment pipeline | Step 1; stories T-02, T-04, T-05 |
| Replace Keycloak realms and OPA with NextAuth, the permissions module and a Tshepo tenant guard on every route | Step 3; stories T-10 to T-13 |
| Replace the feature store service with Postgres tables and Redis | Step 7; stories T-29 to T-31 |
| Attach origination, repayment and collections to the existing GroCredit and GoPay screens rather than new portals | Steps 10 to 12; stories T-52 to T-55 |
| Add: wallet ledger account kind and limits as a design-only task; build in a later wave | New Wave 4 |

### 20.6 To confirm

These four questions were answered and are resolved in section 21.

## 21. Audit results and migration plan

### 21.1 Answers received

| Question | Answer | Consequence |
| --- | --- | --- |
| Production database and hosting | Everything is still in development mode, with the site on Netlify; the plan is to move to a real server, ideally your own Mac for now | Mac server for development, staging and demos now; hosted Postgres in a South African region before any live money moves |
| Is the 62-model Postgres schema what production runs? | You asked for an audit and a decision | No. See 21.2 |
| Which GoPay routes are live? | None | All GoPay routes are development only; the GoPay settlement split stays disabled in Tshepo |
| Why was the consumer wallet removed? | It caused storage problems and the whole application began to lag on GLM; you want it restored | Restore it with the performance fixes in 21.4 |

### 21.2 Determination: production does not run the 62-model schema

- The Netlify build runs `prisma generate && next build`, which reads the default schema: SQLite, 296 models. No script, Dockerfile or deployment guide refers to the Postgres file.
- A SQLite file on Netlify cannot keep data between deploys and function runs, so production is effectively a demo, which matches what you described.
- The Postgres file is an older design. It has 62 models, 16 of which exist nowhere else (for example Agent, Order, Commission, VirtualCard). Of the 46 it shares with the development schema, 42 differ in their fields.
- 337 of the 553 route handlers that use the database depend on at least one model missing from it, including products, stock movements, consumer users, branches, audit logs and the GoPay tables.
- **Decision:** retire the 62-model file. Use the 296-model schema with only the datasource changed to Postgres. Together with the six Tshepo models it is 302 models and passes the Prisma 6 validator. No migration history exists yet, so a baseline migration is created on the new database.
- About 460 money and number fields are still floating point. They are not changed by this move; the ledger is the place where exact money is kept.
- The database client logged every query in production and kept a client per reload. The replacement keeps one client per process and turns query logging off unless `PRISMA_LOG_QUERIES=1`. This is a plausible contributor to the lag you saw, not a confirmed cause.

### 21.3 Mac server plan

The zip contains `groway-changes/MAC_SERVER_SETUP.md`, the converted `schema.prisma` and the fixed `db.ts`. In order:

1. Install Postgres 16 on the Mac, create the database and a restricted application role.
2. Replace the schema and database client, then create the baseline migration and commit it.
3. Apply the Tshepo ledger guards.
4. Move the data from `dev.db` (or re-seed) and check row counts per table.
5. Run the production build under a process manager, and publish it through a tunnel so no router ports are opened.
6. Keep the Mac awake on a UPS with disk encryption, and take encrypted nightly dumps copied off the machine, with a monthly restore test.

A Mac is fine for development, staging and demos. It is not a safe home for live credit or payments, because of uptime, backups and the personal data involved. Move to hosted Postgres in a South African region before any pilot.

### 21.4 Restoring the consumer wallet

The wallet page is a single 556 KB client file in a 1.9 MB folder, with older backup copies of the page beside it, so every wallet screen loads at once. I cannot see the GLM environment, so these are the likely contributors rather than a confirmed cause.

| Step | Action |
| --- | --- |
| 1 | Move the backup copies out of the app folder and delete dead code |
| 2 | Split the page into its five tabs (Home, Pay, Services, Offers, Profile) and load each tab only when opened |
| 3 | Fetch long lists a page at a time from the existing consumer and wallet routes |
| 4 | Run on Postgres with query logging off instead of a SQLite file |
| 5 | Add a bundle size limit to CI so the page cannot grow back unnoticed |
| 6 | Link the wallet to the Tshepo ledger through the `consumer_wallet` account kind, behind a feature flag |

The licensing question for holding customer funds still has to be settled before the wallet goes live for real customers.

### 21.5 Order of work

1. Postgres on the Mac, the baseline migration and the database client fix.
2. Tshepo models and ledger guards, then the data move.
3. Run the Tshepo tests inside the Groway repo with jest.
4. Tshepo Wave 1 steps 2 to 14, with GoPay stories held until go-live.
5. Consumer wallet restoration as the new Wave 4, once licensing is settled.
