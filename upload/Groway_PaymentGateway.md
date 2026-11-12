+-----------------------------------------------------------------------+
| **groway**                                                            |
|                                                                       |
| Africa\'s Integrated Financial Operating System                       |
|                                                                       |
| **PAYMENT GATEWAY**                                                   |
|                                                                       |
| Architecture, Development & Compliance Plan                           |
|                                                                       |
| Prepared by: Motheto Selepe, Founder & CEO \| Technology Division     |
|                                                                       |
| March 2026 \| Version 1.0 \| Confidential                             |
+-----------------------------------------------------------------------+

**1. Executive Summary**

Groway\'s payment gateway is the financial engine at the centre of its
integrated operating system. It must process merchant card and QR
acceptance, consumer P2P transfers, bill payments, VAS top-ups,
remittances, and B2B procurement settlements --- all through a single,
regulated, PCI-DSS-compliant infrastructure.

This document defines the full technical architecture, regulatory
licensing pathway, development phasing, vendor selection, security
framework, and cost model for the Groway GoPay Engine --- the
proprietary payment processing core of the Groway platform.

  ----------- ---------------------------------------------------------------------
  **SCOPE**   This plan covers: (1) Payment gateway architecture and components,
              (2) SARB regulatory licensing, (3) Payment rail integrations
              (PayShap, BankServ, card networks), (4) PCI-DSS Level 1 compliance,
              (5) SmartPOS and USSD acceptance, (6) Fraud and risk engine, (7)
              Settlement and reconciliation, (8) International remittance, (9)
              Development phasing and team, (10) Cost model.

  ----------- ---------------------------------------------------------------------

**2. What Groway\'s Payment Gateway Must Do**

**2.1 Transaction Types**

The Groway GoPay Engine must support nine distinct transaction types
across two user classes (merchant and consumer):

  -------- ---------------------- --------------- -------------------------------
  **\#**   **Transaction Type**   **User Class**  **Description**

  1        Merchant POS           Merchant        Card-present (tap, chip, swipe)
           Acceptance                             and QR acceptance on SmartPOS
                                                  terminal or Android SoftPOS.

  2        QR Payment             Both            Consumer scans merchant QR to
           (Consumer-initiated)                   pay from Groway wallet. Settled
                                                  in real-time.

  3        Consumer P2P Transfer  Consumer        Send money from Groway wallet
                                                  to any SA bank account or
                                                  Groway wallet via PayShap/EFT.

  4        Bill Payment           Consumer        DStv, municipal utilities,
                                                  prepaid electricity
                                                  (Eskom/municipal), traffic
                                                  fines.

  5        Airtime & Data (VAS)   Consumer        MTN, Vodacom, Cell C, Telkom
                                                  recharge. Purchased against
                                                  wallet balance.

  6        BNPL Disbursement      Consumer        Buy Now Pay Later advance
                                                  disbursed into wallet at
                                                  checkout. Repaid via scheduled
                                                  debit.

  7        GroCredit Disbursement Merchant        Merchant working capital
                                                  disbursed to merchant wallet.
                                                  Revenue-share auto-debit daily.

  8        GroSupply Settlement   Merchant        B2B procurement payment:
                                                  merchant pays supplier via
                                                  platform-generated purchase
                                                  order.

  9        Remittance             Consumer        SA → Zimbabwe, Zambia, Lesotho,
           (Cross-border)                         Mozambique. White-label via
                                                  licensed remittance partners.
  -------- ---------------------- --------------- -------------------------------

**2.2 Performance Requirements**

  ------------------------ ----------------------------------------------
  **Transaction            10,000 TPS peak capacity (Year 3 scale).
  throughput**             Initial capacity: 500 TPS at launch.

  **API response time**    \< 800ms for payment initiation to
                           authorisation response. \< 3 seconds for full
                           settlement confirmation.

  **Availability SLA**     99.95% uptime. Maximum 4.38 hours downtime per
                           year. Measured at API gateway level.

  **Failover**             Active-active architecture across two AWS
                           availability zones (af-south-1a and
                           af-south-1b).

  **Transaction history**  7 years retention, encrypted at rest, POPIA
                           and NCR compliant.

  **Currency support**     ZAR primary. USD, NAD, BWP, LSL, SZL for SADC
                           corridors. Currency conversion via BancTec or
                           OFX.
  ------------------------ ----------------------------------------------

**3. Technical Architecture**

**3.1 Architecture Overview**

The Groway GoPay Engine is built on a cloud-native microservices
architecture deployed on AWS (af-south-1 --- Cape Town region). Each
payment function is a discrete, independently deployable service
communicating over an internal message bus (Apache Kafka) and a
REST/gRPC API layer.

  ------------- ---------------------------------------------------------------------
  **DESIGN      Groway builds a thin orchestration layer on top of licensed payment
  PRINCIPLE**   rails (PayShap, BancTec EFT, Electrum VAS). We do not rebuild
                clearing infrastructure --- we orchestrate it. This reduces
                regulatory risk, accelerates time to market, and concentrates
                engineering effort on differentiated features (data, credit scoring,
                merchant experience).

  ------------- ---------------------------------------------------------------------

**3.2 Core Microservices**

  ------------------ ------------------------- ---------------------------
  **Service**        **Function**              **Technology Stack**

  API Gateway        Single entry point for    AWS API Gateway + Kong. TLS
                     all payment requests.     1.3 enforced.
                     Rate limiting,            
                     authentication (OAuth 2.0 
                     / JWT), request routing.  

  Auth & Identity    FICA Tier 1/2/3           Node.js. Integration: Home
  Service            verification, session     Affairs HANIS API, Smile
                     management, device        Identity, Onfido.
                     fingerprinting, biometric 
                     token binding.            

  Payment            Core routing engine.      Java / Spring Boot. Apache
  Orchestrator       Determines which rail to  Kafka event bus.
                     use for each transaction  
                     type. Retry logic,        
                     timeout handling, saga    
                     pattern for distributed   
                     transactions.             

  Card Processing    EMV chip, contactless     Integration: Nuvei SA or
  Service            (NFC), and magnetic       Network International as
                     stripe processing for     card acquirer. PCI P2PE.
                     SmartPOS terminals.       

  QR & Wallet        Groway QR code generation Node.js. PostgreSQL for
  Service            (PASA-aligned format),    wallet ledger. Redis for
                     wallet-to-wallet          real-time balance cache.
                     settlement, balance       
                     management.               

  EFT & PayShap      Real-time interbank       BankServ PayShap API
  Service            payments via BankServ     (direct participant or via
                     PayShap rails. Standard   sponsor bank --- Nedbank or
                     EFT for batch             Absa).
                     settlements.              

  VAS Service        Airtime, data,            REST integration. Electrum
                     electricity, DStv via     SmartLoad API.
                     Electrum or Bluegum       
                     wholesale aggregator.     

  Remittance Service Cross-border transfer     Integration: Mama Money,
                     orchestration via         LemFi, or direct IMT
                     white-label partner API.  licence route.

  Fraud & Risk       Real-time transaction     Python ML models
  Engine             scoring. Velocity checks, (scikit-learn / TensorFlow
                     device fingerprint,       Lite). AWS SageMaker for
                     behavioural anomaly       model serving.
                     detection.                

  Settlement &       End-of-day settlement     Python. PostgreSQL.
  Reconciliation     runs. Merchant payout     Automated via Apache
                     scheduling. Three-way     Airflow DAGs.
                     match for GroSupply.      

  Notification       SMS, push, WhatsApp,      AWS SNS + SES. Twilio for
  Service            email confirmation for    WhatsApp. SMPP gateway for
                     all transaction events.   USSD.

  Ledger Service     Immutable double-entry    Event-sourced architecture.
                     ledger for all money      Apache Kafka + PostgreSQL.
                     movements. Audit trail    Read-only audit replica.
                     for SARB and NCR.         
  ------------------ ------------------------- ---------------------------

**3.3 Infrastructure Architecture**

  ------------------------ ----------------------------------------------
  **Cloud Provider**       AWS af-south-1 (Cape Town) primary. All data
                           residency in South Africa --- SARB and POPIA
                           requirement.

  **Compute**              Amazon EKS (Kubernetes) for all microservices.
                           Horizontal pod autoscaling tied to TPS
                           metrics.

  **Database**             Amazon RDS PostgreSQL (Multi-AZ) for
                           transactional data. Amazon DynamoDB for
                           session state. ElastiCache Redis for real-time
                           balance cache.

  **Message Bus**          Apache Kafka on Amazon MSK. All payment events
                           published to Kafka topics. Services consume
                           asynchronously where possible.

  **Storage**              Amazon S3 for documents, audit logs. Encrypted
                           with AWS KMS. 7-year retention policy enforced
                           via S3 Lifecycle.

  **Secrets Management**   AWS Secrets Manager for all API keys,
                           credentials. No secrets in code or environment
                           variables.

  **CDN & DDoS**           AWS CloudFront + AWS Shield Advanced. WAF
                           rules tuned for OWASP Top 10 and
                           payment-specific attack vectors.

  **Monitoring**           AWS CloudWatch + Datadog APM. PagerDuty for
                           on-call alerting. Real-time TPS dashboard on
                           Grafana.

  **Disaster Recovery**    RPO: 15 minutes. RTO: 4 hours. Automated
                           snapshots every 15 minutes. DR runbook tested
                           quarterly.
  ------------------------ ----------------------------------------------

**4. Payment Rail Integrations**

**4.1 PayShap --- Real-Time Interbank**

PayShap is BankServ Africa\'s real-time interbank payment system,
launched 2023. It enables instant ZAR payments between any South African
bank account using a ShapID (mobile number, ID number, or account
number) as the proxy.

  ------------- ---------------------------------------------------------------------
  **STRATEGIC   PayShap eliminates the need for Groway to build its own interbank
  RATIONALE**   clearing infrastructure. By riding PayShap rails, Groway achieves
                real-time settlement between Groway wallets and any SA bank ---
                enabling truly instant merchant payouts and consumer transfers at low
                cost (targeting \< 50c per transaction).

  ------------- ---------------------------------------------------------------------

  ------------------------ ----------------------------------------------
  **Participation Model**  Groway will connect to PayShap as an indirect
                           participant via a sponsor bank (Nedbank or
                           Absa Business Banking). Direct participation
                           requires a full banking licence --- not
                           required for Groway\'s PSO model.

  **Integration Method**   BankServ PayShap API (REST). Sponsor bank
                           provides API gateway access. Groway manages
                           ShapID registration for merchant and consumer
                           accounts.

  **Transaction Limits**   R3,000 per transaction initially (SARB
                           mandated cap for Phase 1). Expected to
                           increase to R10,000+ in Phase 2 PayShap
                           rollout.

  **Settlement Speed**     Immediate (\< 10 seconds) for wallet-to-bank
                           and bank-to-wallet. Batch EFT (T+1) used for
                           amounts above PayShap limit.

  **Cost**                 Sponsor bank charges R0.20--R0.50 per PayShap
                           transaction. Groway absorbs for consumer P2P;
                           passes through at R0.00--R0.99 for merchant
                           payouts.

  **Timeline to Live**     8--12 weeks from sponsor bank onboarding
                           initiation to first live transaction.
  ------------------------ ----------------------------------------------

**4.2 Card Acceptance (EMV / Contactless / SoftPOS)**

Card acceptance requires integration with a card acquirer --- a licensed
entity that connects Groway to Visa, Mastercard, and Diners networks for
authorisation and settlement.

  --------------- ------------------ ------------------ -------------------
  **Vendor**      **Model**          **MDR (Merchant    **Integration**
                                     Discount Rate)**   

  Nuvei SA        Card acquirer.     1.5--2.5% (tiered  REST API + SDK. PCI
                  Groway             by volume)         P2PE hardware.
                  white-labels under                    
                  Nuvei\'s SA                           
                  licence.                              

  Network         Pan-African        1.8--2.8%          REST API. SmartPOS
  International   acquirer.                             terminal supply.
                  Preferred for SADC                    
                  expansion.                            

  Peach Payments  SA-based payment   1.8--2.5%          REST API + plugins.
                  gateway with                          
                  acquiring                             
                  capabilities.                         

  DPO Group       African acquirer   2.0--3.0%          REST API. Strong in
                  with 18-country                       Zambia/Zim.
                  coverage.                             
  --------------- ------------------ ------------------ -------------------

Recommended: Nuvei SA as primary acquirer for Year 1 (competitive MDR,
SA-domiciled, strong PCI P2PE hardware supply). Network International
added in Year 2 for SADC route.

**4.3 USSD Gateway**

USSD enables feature phone users (non-smartphone) to access Groway
services by dialling a short code (e.g., \*120\*GROWAY#). This is
critical for township merchants and consumers who may not own
smartphones.

  ------------------------ ----------------------------------------------
  **USSD Channel**         Groway registers a USSD short code via
                           ICASA-licensed USSD aggregator (Melrose or
                           Alphacomm). Channels: MTN, Vodacom, Cell C,
                           Telkom --- all four MNOs.

  **USSD Flow**            Merchant: check balance, initiate payment,
                           view last 5 transactions. Consumer: wallet
                           balance, send money, buy airtime.

  **Session Timeout**      USSD sessions timeout after 180 seconds. All
                           transaction states must be resumable.

  **Integration**          USSD gateway connects to Groway API Gateway
                           via REST. Session management handled by
                           Notification Service.

  **Cost**                 USSD aggregator charges R0.05--R0.10 per
                           session. Groway absorbs for core transactions.
                           Network operator revenue sharing applied.
  ------------------------ ----------------------------------------------

**4.4 VAS Integration (Airtime, Electricity, Bills)**

  ------------------------ ----------------------------------------------
  **Electrum SmartLoad**   Primary VAS aggregator. MTN, Vodacom, Cell C,
                           Telkom airtime and data. Eskom and municipal
                           electricity. DStv and GOtv.

  **Integration Model**    Electrum REST API with pre-funded float
                           account. Groway pre-funds R500,000 float with
                           Electrum. Replenished automatically when
                           balance drops below R100,000.

  **Bill Payments**        Municipal utilities via Paytgate or BillSmart
                           aggregator. Traffic fines via NPay. School
                           fees via SnapScan B2B.

  **Margin**               Electrum gives Groway 3--8% wholesale discount
                           on face value. Consumer pays face value.
                           Margin captured by Groway.
  ------------------------ ----------------------------------------------

**5. Regulatory Licensing & Compliance**

**5.1 SARB Payment System Operator (PSO) Licence**

Groway must be licensed as a Payment System Operator (PSO) by the South
African Reserve Bank under the National Payment System Act 78 of 1998
(NPSA) to operate its own payment processing infrastructure and hold
customer funds in a wallet.

  ---------------------- ------------------------------------------------
  **Requirement**        **Detail**

  Licensing Authority    South African Reserve Bank (SARB) --- Payment
                         and Settlement Systems Department.

  Applicable Legislation National Payment System Act 78 of 1998. SARB
                         Directive 1 of 2007 (Payment System Management
                         Body). SARB Position Paper 01/2021 (Fintech).

  Licence Category       Third-Party Payment Provider (TPPP) --- covers
                         wallet operators, payment initiators, and
                         payment aggregators. Groway applies as a TPPP.

  Sponsor Bank           TPPP must operate via a Designated Settlement
                         Bank (DSB). Groway selects Nedbank or Absa.
                         Sponsor bank holds pooled client money in a
                         trust account. Groway cannot commingle client
                         funds with operational funds.

  Capital Requirement    R5 million minimum paid-up capital required for
                         TPPP application. Groway capitalises at R10M to
                         demonstrate robustness.

  Client Money           Customer wallet balances held in segregated bank
  Safeguarding           account (trust). Not available to creditors in
                         event of insolvency.

  Application Process    Submit to SARB: business plan, ownership
                         structure, AML/CFT programme, IT security
                         assessment, financial projections, board
                         fit-and-proper declarations. SARB review takes
                         6--12 months.

  Interim Strategy       While SARB licence pending, Groway operates
                         under sponsor bank\'s licence as a registered
                         TPPP agent. Full independent PSO status targeted
                         by Month 18.
  ---------------------- ------------------------------------------------

**5.2 NCR Registration (Credit)**

GroCredit and BNPL products require registration as a Credit Provider
with the National Credit Regulator (NCR) under the National Credit Act
34 of 2005 (NCA).

  ------------------------ ----------------------------------------------
  **Registration           Any entity offering credit above R500,000
  Threshold**              total book must register. Groway registers
                           from Day 1.

  **Required               NCR Form 1 (credit provider application),
  Documentation**          proof of paid-up capital, AML policy, credit
                           agreement templates, affordability assessment
                           methodology.

  **Interest Rate Caps**   NCA prescribes maximum interest rates per
                           credit category. Personal loans: repo rate +
                           21%. BNPL structured as short-term credit:
                           repo rate + 5% per transaction.

  **Reckless Lending**     Groway\'s credit scoring engine must document
                           affordability assessments for every credit
                           decision. NCR can impose R1M+ fines for
                           reckless lending.

  **Annual Returns**       NCR requires annual credit provider returns.
                           Groway\'s compliance system auto-generates
                           returns from ledger data.
  ------------------------ ----------------------------------------------

**5.3 FICA & AML/CFT Compliance**

Groway is an Accountable Institution under the Financial Intelligence
Centre Act (FICA) and must maintain a robust AML/CFT programme.

  ------------------ ----------------------------------------------------
  **FICA             **Groway Implementation**
  Requirement**      

  Customer Due       Tier 1 (wallet only): SA ID verified via Home
  Diligence (CDD)    Affairs HANIS API + selfie liveness check via Smile
                     Identity. Instant. 0 paper. R3,000/month transact
                     limit. Tier 2 (wallet + credit): Proof of address +
                     proof of income (bank statement or payslip).
                     R50,000/month limit. Tier 3 (merchant full): Company
                     registration + CIPC check + director ID. Unlimited.

  Ongoing Monitoring Transaction monitoring engine (Napier or
                     ComplyAdvantage) flags transactions against:
                     velocity rules, round-amount patterns, structuring
                     behaviour, sanctions screening (OFAC, EU, UN).

  Suspicious         Head of Compliance (MLRO) reviews and submits STRs
  Transaction        to the FIC within 15 days of suspicion arising.
  Reports (STRs)     Automated queue in compliance dashboard.

  Record Keeping     All KYC documents and transaction records retained
                     for minimum 5 years (FICA) or 7 years (NCA for
                     credit). Encrypted, immutable storage on AWS S3.

  POPIA Compliance   Privacy notice presented at onboarding. Data
                     processing consent captured digitally. Right to
                     deletion exercisable (subject to regulatory
                     minimums). DPO appointed from Year 2.
  ------------------ ----------------------------------------------------

**6. PCI-DSS Compliance**

**6.1 PCI-DSS Level Requirements**

Groway processes card transactions on behalf of merchants. As a payment
facilitator (PayFac model), Groway must achieve PCI-DSS Level 1
compliance --- the highest standard --- once it processes more than 6
million card transactions per year. Until that threshold, PCI-DSS Level
2 applies (SAQ-D questionnaire + external ASV scan).

  --------------- ------------------- ------------------ -------------------
  **Level**       **Transaction       **Requirement**    **Groway Timeline**
                  Volume**                               

  Level 1         \> 6M               Annual on-site QSA Year 2 target
                  transactions/year   audit + quarterly  
                                      ASV scan +         
                                      penetration test   

  Level 2         1M--6M/year         Annual SAQ-D +     Launch through Year
                                      quarterly ASV scan 1

  Level 3         20,000--1M/year     Annual SAQ-D +     Pre-launch
                                      quarterly ASV scan 

  Level 4         \< 20,000/year      Annual SAQ-A or    N/A (immediately
                                      SAQ-D              above)
  --------------- ------------------- ------------------ -------------------

**6.2 PCI-DSS 12 Requirements --- Groway Implementation**

  -------- ---------------------- --------------------------------------------
  **\#**   **Requirement**        **Groway Control**

  1        Network Security       AWS VPC with private subnets for all payment
           Controls               services. No direct internet access to
                                  cardholder data environment (CDE). Security
                                  groups restrict ingress to API Gateway only.

  2        No Vendor-Supplied     All systems deployed from hardened AMIs
           Defaults               (Amazon Linux 2023). No default passwords.
                                  CIS benchmark applied via AWS Inspector.

  3        Protect Stored         Groway uses point-to-point encryption (P2PE)
           Cardholder Data        on all SmartPOS terminals. Card data (PAN,
                                  CVV) never stored in Groway systems.
                                  Tokenisation via Nuvei vault --- only tokens
                                  stored.

  4        Protect Cardholder     TLS 1.3 mandatory on all endpoints. TLS 1.0
           Data in Transit        and 1.1 disabled at load balancer. Mutual
                                  TLS (mTLS) between internal microservices.

  5        Protect Against        CrowdStrike Falcon deployed on all EC2
           Malicious Software     instances. Container image scanning via
                                  Amazon ECR. SAST in CI/CD pipeline (Snyk).
                                  Dependency vulnerability scanning.

  6        Develop Secure Systems Secure SDLC enforced. OWASP Top 10 addressed
                                  in code review checklist. Security
                                  engineering squad reviews all
                                  payment-related PRs. Annual third-party
                                  penetration test (CREST-certified).

  7        Restrict Access to     Role-based access control (RBAC) via AWS
           System Components      IAM. Principle of least privilege. No
                                  engineer has standing production access ---
                                  all access via time-limited break-glass
                                  procedure.

  8        Identify and           Multi-factor authentication enforced for all
           Authenticate Users     admin access. Privileged access managed via
                                  CyberArk or HashiCorp Vault. Session
                                  timeout: 15 minutes for payment admin
                                  consoles.

  9        Restrict Physical      AWS manages physical security at af-south-1
           Access                 data centres. SmartPOS terminals tracked by
                                  serial number. Tamper-evident seal. Device
                                  management via MDM (Jamf or SOTI).

  10       Log and Monitor All    Centralised logging via AWS CloudTrail +
           Access                 CloudWatch. All payment events logged to
                                  immutable Kafka topics. SIEM (Splunk or AWS
                                  Security Hub) for anomaly detection.

  11       Test Security          Quarterly ASV scans (Trustwave or Qualys).
           Regularly              Annual penetration test. Quarterly internal
                                  vulnerability scanning. Annual PCI QSA
                                  review (Year 2+).

  12       Maintain Information   Information Security Policy documented and
           Security Policy        reviewed annually. All staff complete annual
                                  security awareness training. Incident
                                  response plan tested semi-annually.
  -------- ---------------------- --------------------------------------------

**7. Fraud Detection & Risk Engine**

**7.1 Architecture**

Groway\'s fraud and risk engine is a real-time machine learning pipeline
that scores every transaction within 200ms before authorisation. It
combines rule-based controls (fast, deterministic) with ML models
(adaptive, learns from patterns).

**7.2 Risk Signals**

  ------------------ ------------------------- ---------------------------
  **Signal           **Signals Used**          **Model Response**
  Category**                                   

  Device Fingerprint Device ID, OS version,    Flag new device. Soft block
                     app version,              if device previously
                     root/jailbreak detection, flagged for fraud.
                     GPS vs registered         
                     merchant location.        

  Transaction        \# transactions in last   Soft decline. OTP step-up
  Velocity           60 minutes, 24 hours, 7   required. Alert sent to
                     days. Unusual spike in    MLRO queue.
                     transaction count or      
                     value.                    

  Behavioural        Time-of-day pattern,      Deviation \> 3 sigma from
  Baseline           merchant category usage,  baseline triggers step-up
                     average transaction size  authentication.
                     for this user.            

  Counterparty Risk  Recipient account on      Hard decline. STR
                     sanctions list (OFAC, UN, auto-generated. MLRO
                     EU). Known money mule     notified in real-time.
                     accounts from FIC         
                     typologies.               

  Amount Patterns    Structuring signals       Flag for manual review.
                     (multiple transactions    Escalate to MLRO if pattern
                     just below R3,000         continues.
                     threshold). Round         
                     amounts. Unusual          
                     frequency.                

  Location Anomaly   Transaction initiated     Require additional
                     from different province   authentication. Hold
                     or country than usual.    transaction for 30 seconds.
                     SIM swap detected in last 
                     24hrs.                    

  Merchant Category  High-risk merchant        Enhanced monitoring.
  Risk               categories (gambling,     Transaction limit applied.
                     crypto exchanges).        Manual approval for first
                     First-time merchant. New  20 transactions.
                     merchant with unusual     
                     volume.                   
  ------------------ ------------------------- ---------------------------

**7.3 ML Model Stack**

  ------------------------ ----------------------------------------------
  **Model Type**           Gradient boosted trees (XGBoost) for
                           transaction scoring. LSTM recurrent network
                           for sequence anomaly detection. Isolation
                           forest for unsupervised outlier detection.

  **Training Data**        Synthetic fraud data from Featurespace or
                           Feedzai datasets for initial model. Replaced
                           with Groway proprietary data from Month 6
                           onward.

  **Model Serving**        AWS SageMaker real-time inference endpoint.
                           Target latency \< 50ms for model inference
                           (total 200ms budget includes network and
                           logic).

  **Feedback Loop**        Confirmed fraud events and false positives
                           feed back to retraining pipeline weekly. Model
                           versioning via MLflow.

  **Explainability**       Every decline or flag includes a
                           human-readable reason code (e.g.,
                           \'Transaction velocity exceeded\') for
                           customer service and regulatory audit
                           purposes.
  ------------------------ ----------------------------------------------

**8. Settlement & Reconciliation**

**8.1 Settlement Flow**

Settlement is the process by which Groway converts transaction
authorisations into actual money movements. Groway operates a T+1
settlement cycle for card transactions and real-time settlement for
PayShap and wallet transactions.

  -------------------- ------------------- ------------------ ----------------------
  **Payment Type**     **Authorisation**   **Settlement**     **Merchant Payout**

  Card (POS)           Real-time (\< 3     T+1 batch via card T+1 to merchant
                       sec)                acquirer           wallet. Optional
                                                              instant payout at 1%
                                                              fee.

  QR                   Real-time (\< 2     Immediate internal Instant to merchant
  (Wallet-to-Wallet)   sec)                ledger             wallet. No fee.

  PayShap              Real-time (\< 10    Immediate via      Instant to destination
  (Wallet-to-Bank)     sec)                BankServ           bank account.

  EFT                  Near-real-time (T+0 T+1 standard       T+1 to merchant or
                       for some banks)                        consumer wallet.

  GroCredit Repayment  Daily auto-debit    Real-time          Revenue credited to
                                           deduction from     Groway GroCredit pool.
                                           merchant wallet    

  GroSupply PO Payment On PO approval      T+1 to supplier    Supplier receives net
                                                              of Groway 2--4%
                                                              marketplace fee.
  -------------------- ------------------- ------------------ ----------------------

**8.2 Reconciliation Engine**

  ------------------------ ----------------------------------------------
  **Three-Way Match        Purchase Order → Goods Received Note →
  (GroSupply)**            Supplier Invoice must all match before payment
                           releases. Automated via GroSupply
                           Reconciliation Service.

  **Daily Balancing**      End-of-day automated reconciliation: sum of
                           all wallet balances = sum of funds in sponsor
                           bank trust account. Discrepancy \> R100
                           triggers alert to CFO and Head of Compliance.

  **Chargeback             Card chargebacks handled via acquirer portal.
  Management**             Groway maintains dispute evidence (receipt,
                           GPS, device ID, transaction log) for minimum
                           18 months.

  **SARB Reporting**       Monthly position reporting to SARB on total
                           payment volumes, average transaction values,
                           and outstanding wallet balances (required for
                           TPPP supervision).

  **Audit Trail**          Every money movement produces an immutable
                           event in the Ledger Service (Kafka +
                           PostgreSQL). Events are cryptographically
                           chained. Tamper detection built in.
  ------------------------ ----------------------------------------------

**9. SmartPOS Terminal Programme**

**9.1 Terminal Selection**

Groway deploys Android-based SmartPOS terminals to merchants who require
a dedicated device (as opposed to SoftPOS on their existing Android
phone). Terminals must support EMV chip, NFC contactless, magnetic
stripe, QR display, and receipt printing.

  --------------- --------------- -------------- -------------------------
  **Device**      **Supplier**    **Cost (ex     **Notes**
                                  VAT)**         

  PAX A920 Pro    PAX Technology  R1,850         Android 10. 5-inch
                  (via local                     touchscreen. 4G+WiFi.
                  distributor)                   Popular in SA market.
                                                 Tekcetera supply
                                                 relationship.

  Sunmi V2s       Sunmi           R1,600         Android 9. 4-inch.
                  Technology                     Lightweight. Fast boot.
                                                 China manufacturing
                                                 pipeline.

  Ingenico AXIUM  Ingenico        R2,400         Android 11. Premium
  DX8000          (Worldline)                    finish. Better for
                                                 salons/restaurants. Full
                                                 receipt printer.

  SoftPOS (No     Groway App on   R 0            NFC tap-to-pay on Android
  Hardware)       merchant\'s                    9+. No hardware cost.
                  Android phone                  Limited to NFC-capable
                                                 devices.
  --------------- --------------- -------------- -------------------------

Recommended: PAX A920 Pro as primary device (best supply chain,
Tekcetera relationship). SoftPOS as default for all salon and small
merchant activations (cost R0). SmartPOS only deployed where merchant
processes card volumes above R20,000/month.

**9.2 Terminal Management System (TMS)**

  ------------------------ ----------------------------------------------
  **Remote Provisioning**  All terminals provisioned over-the-air via
                           TMS. Groway app, payment keys, and merchant
                           configuration pushed remotely. No physical USB
                           setup.

  **Key Injection**        PCI P2PE-compliant key injection facility
                           (KIF). DUKPT key management. Keys injected by
                           certified KIF provider before terminal ships.

  **Device Monitoring**    TMS monitors heartbeat every 5 minutes.
                           Offline terminals flagged. Technician dispatch
                           triggered if offline \> 4 hours during trading
                           hours.

  **Remote Wipe**          Lost or stolen terminals remotely wiped via
                           TMS within 2 minutes of report. Device
                           rendered inoperable.

  **Firmware Updates**     Pushed via TMS during non-trading hours
                           (2am--4am SAST). Rollback capability
                           maintained for 30 days.
  ------------------------ ----------------------------------------------

**10. Cross-Border Remittance**

**10.1 Strategy**

Remittance is a high-volume, high-frequency use case for Groway\'s
consumer wallet. SA hosts 3.9 million foreign nationals (UNHCR 2024),
primarily from Zimbabwe, Mozambique, Lesotho, and Zambia --- all of whom
send money home regularly.

  --------------- ---------------------------------------------------------------------
  **CORRIDOR      SA→Zimbabwe is Africa\'s 4th largest remittance corridor. Annual
  OPPORTUNITY**   flows of USD 900M+ at average cost of 10--15%. Groway targets 3--5%
                  total cost to sender --- 50--70% cheaper than informal channels
                  (Western Union, hawala, bus driver couriers).

  --------------- ---------------------------------------------------------------------

**10.2 Licensing Options**

  ------------------ --------------------------- -------------------------
  **Option**         **Description**             **Timeline & Cost**

  White-label via    Partner with SA-licensed    0 additional licensing.
  Mama Money         remittance provider. Groway 8--12 weeks to integrate.
                     initiates transfers via     Revenue share: Groway
                     API; Mama Money holds SARB  keeps 40% of FX spread.
                     authorised dealer licence.  

  White-label via    Pan-African remittance API. 0 additional licensing.
  LemFi              Covers 50+ corridors        6--8 weeks to integrate.
                     including all SADC target   Per-transfer fee: USD
                     markets.                    1.50--2.00.

  Own SARB           Apply for Category 1        24--36 months. Capital
  Authorised Dealer  Authorised Dealer status    requirement R20M+. Year
  Licence            from SARB. Enables Groway   3+ only.
                     to hold and convert foreign 
                     currency.                   
  ------------------ --------------------------- -------------------------

Recommended: White-label via LemFi for launch (fastest, zero licensing).
Mama Money as backup provider. Proprietary Authorised Dealer application
initiated in Year 3 after volume justifies the licence cost.

**11. Development Phasing & Roadmap**

**11.1 Phase 1 --- Core Gateway (Months 1--6, 2026)**

Goal: Production-ready payment gateway capable of merchant QR
acceptance, consumer wallet, PayShap P2P, and VAS. Launch with 500 TPS
capacity.

  ----------- --------------------------------------- ----------------------
  **Month**   **Deliverable**                         **Owner**

  M1--2       API Gateway + Auth Service live on AWS  CTO + 2× Senior
              EKS. FICA Tier 1 onboarding (HANIS +    Backend
              liveness check). Wallet creation and    
              balance management.                     

  M2--3       QR payment engine live                  Backend team
              (wallet-to-wallet). Merchant QR         
              generation. Consumer QR scan. Real-time 
              settlement.                             

  M3--4       PayShap integration via sponsor bank.   Backend + DevOps
              Wallet-to-bank transfers live. BankServ 
              API testing in sandbox.                 

  M4--5       VAS integration (Electrum SmartLoad).   Backend
              Airtime, data, electricity live. DStv   
              activation.                             

  M5--6       Card acceptance via Nuvei SA (SoftPOS   Backend + Security Eng
              Android SDK). First 50 merchant pilot.  
              PCI-DSS SAQ-D submitted.                

  M6          Full Phase 1 gateway live. 50 merchant  Full engineering team
              pilot. Internal load test to 500 TPS.   
              Bug bash and hardening.                 
  ----------- --------------------------------------- ----------------------

**11.2 Phase 2 --- Full Platform (Months 7--12, 2026)**

Goal: All nine transaction types live. SmartPOS terminal rollout. Fraud
engine operational. SARB TPPP application submitted. 8,000 merchant
target in reach.

  ----------- --------------------------------------- ----------------------
  **Month**   **Deliverable**                         **Owner**

  M7--8       PAX A920 Pro SmartPOS terminal          CTO + DevOps
              management system. Remote provisioning. 
              Key injection pipeline established.     

  M8--9       GroCredit disbursement engine.          Backend + Legal
              Revenue-share daily auto-debit logic.   
              NCR credit agreement templates.         

  M9--10      Fraud & risk engine v1 live. Rule-based Security + Data
              controls + XGBoost model.               Science
              ComplyAdvantage sanctions screening.    

  M10--11     GroSupply three-way match settlement.   Backend + Product
              B2B payment flows. Supplier onboarding  
              portal.                                 

  M11         Remittance live via LemFi. SA→ZW,       Backend
              SA→ZM, SA→LS corridors. USSD gateway    
              for feature phones.                     

  M12         SARB TPPP licence application           CTO + Compliance
              submitted. PCI-DSS Level 2 certified.   
              Full disaster recovery test.            
  ----------- --------------------------------------- ----------------------

**11.3 Phase 3 --- Scale & Expansion (Year 2--3)**

Goal: PCI-DSS Level 1 certification. 10,000 TPS capacity. SADC expansion
payment rails. Direct PayShap participation application. Data platform
monetisation.

-   PCI-DSS Level 1 QSA on-site audit --- Year 2 Q2

-   Network International integration for SADC card acceptance --- Year
    2 Q3

-   DPO Group integration for Zimbabwe and Zambia --- Year 2 Q4

-   AWS capacity scale-out to 10,000 TPS --- Year 3 Q1

-   SARB Authorised Dealer licence application --- Year 3 Q2

-   Open Banking API (SARB Open Finance roadmap) integration --- Year 3
    Q3

**12. Payment Gateway Engineering Team**

  --------------------- ---------- ---------- ----------------------------
  **Role**              **Year 1   **Year 2   **Primary Responsibility**
                        HC**       HC**       

  CTO                   1          1          Architecture ownership.
                                              Vendor relationships.
                                              PCI-DSS programme owner.

  Senior Backend        2          4          Payment Orchestrator, Ledger
  Engineer (Payments)                         Service, Settlement Engine
                                              core development.

  Senior Backend        1          2          Wallet Service, Auth, FICA
  Engineer (Consumer)                         onboarding, BNPL.

  Mobile Developer      1          2          SoftPOS SDK, merchant
  (Android/SoftPOS)                           Android app, consumer wallet
                                              app.

  DevOps / Platform     1          2          AWS EKS, Kafka MSK, CI/CD,
  Engineer                                    TMS, monitoring stack.

  Security Engineer     ---        1          PCI-DSS programme,
                                              penetration test
                                              coordination, SIEM
                                              management.

  Data Scientist        ---        1          Fraud ML models, feature
  (Fraud)                                     engineering, SageMaker model
                                              serving.

  QA / Test Engineer    1          2          Payment flow regression
                                              testing, load testing, chaos
                                              engineering.

  **TOTAL ENGINEERING** **7**      **15**     
  --------------------- ---------- ---------- ----------------------------

**13. Payment Gateway Cost Model**

**13.1 Development Costs**

  ---------------------------- -------------- -------------- --------------
  **Cost Item**                **Year 1 (R)** **Year 2 (R)** **Year 3 (R)**

  Engineering team salaries    7,200,000      14,400,000     22,800,000
  (gateway team)                                             

  AWS infrastructure (EKS,     960,000        2,400,000      5,400,000
  RDS, MSK, S3, Shield)                                      

  Card acquirer setup &        120,000        ---            120,000
  certification (Nuvei)                                      

  PayShap sponsor bank         85,000         ---            ---
  onboarding                                                 

  USSD aggregator setup        45,000         ---            ---
  (Melrose/Alphacomm)                                        

  Electrum VAS float           500,000        500,000        1,000,000
  pre-funding                                                

  PCI-DSS certification (SAQ-D 180,000        480,000        600,000
  Year 1 / QSA Year 2)                                       

  Penetration testing (annual, 120,000        150,000        180,000
  CREST-certified)                                           

  SARB TPPP licence            350,000        120,000        240,000
  application fees & legal                                   

  NCR registration & credit    95,000         60,000         60,000
  agreement legal                                            

  Fraud & AML platform         240,000        480,000        720,000
  (ComplyAdvantage/Napier)                                   

  SmartPOS terminals (800      1,480,000      2,960,000      5,550,000
  units @ R1,850)                                            

  Terminal management system   120,000        180,000        240,000
  (TMS software)                                             

  KIF (key injection facility) 85,000         ---            ---
  setup                                                      

  Remittance integration       60,000         ---            ---
  (LemFi)                                                    

  Security tools (CrowdStrike, 180,000        240,000        300,000
  Snyk, HashiCorp)                                           

  **TOTAL GATEWAY COST**       **R            **R            **R
                               11,820,000**   21,970,000**   37,210,000**
  ---------------------------- -------------- -------------- --------------

**13.2 Revenue Generated by Gateway**

  ---------------------------- -------------- -------------- --------------
  **Revenue Stream**           **Year 1 (R)** **Year 2 (R)** **Year 3 (R)**

  Card transaction fees (avg   1,200,000      8,400,000      28,800,000
  1.8% MDR, Groway keeps 0.8%)                               

  QR & wallet transaction fees 480,000        3,200,000      12,000,000
  (0.5%)                                                     

  VAS margin (3--8% on face    960,000        4,800,000      16,000,000
  value)                                                     

  Remittance FX spread (2%)    240,000        1,600,000      6,400,000

  GroCredit interest revenue   ---            2,400,000      14,400,000
  (gateway component)                                        

  **TOTAL GATEWAY REVENUE**    **R            **R            **R
                               2,880,000**    20,400,000**   77,600,000**
  ---------------------------- -------------- -------------- --------------

  ------------- ---------------------------------------------------------------------
  **GATEWAY     Year 1: Net gateway cost R8.94M (subsidised by SaaS revenue). Year 2:
  ECONOMICS**   Gateway revenues R20.4M vs costs R21.97M --- near break-even. Year 3:
                Gateway revenues R77.6M vs costs R37.2M --- R40.4M net contribution.
                The gateway becomes a profit centre by Year 3 independent of SaaS
                subscriptions.

  ------------- ---------------------------------------------------------------------

**14. Technical & Regulatory Risks**

  ------------------ ----------------------- -------------- -------------------
  **Risk**           **Description**         **Severity**   **Mitigation**

  SARB licence delay TPPP application takes  Medium         Apply Month 6.
                     longer than 12 months.                 Engage SARB IFWG
                     Groway operates under                  sandbox for early
                     sponsor bank\'s licence                dialogue. Legal
                     in interim. Revenue                    counsel with SARB
                     model unaffected but                   experience retained
                     direct participation                   from Day 1.
                     delayed.                               

  PCI-DSS breach     Cardholder data         Critical       P2PE on all
                     compromise triggers                    terminals (card
                     Visa/Mastercard fines                  data never reaches
                     (USD                                   Groway systems).
                     5,000--500,000/month)                  Annual pen test.
                     and potential licence                  CrowdStrike
                     revocation.                            endpoint
                                                            protection. No PAN
                                                            storage policy.

  PayShap rail       BankServ PayShap goes   Medium         Fallback to EFT
  outage             offline. Real-time                     batch processing.
                     payments unavailable.                  USSD still
                     Merchant and consumer                  functional. SLA
                     experience degraded.                   with sponsor bank
                                                            for \< 4-hour
                                                            restoration.

  Fraud loss         Fraudulent transactions High           ML fraud engine
                     or account takeover                    live before
                     result in financial                    merchant scale-out.
                     losses if not caught by                ComplyAdvantage
                     risk engine.                           sanctions
                                                            screening. Velocity
                                                            limits enforced.
                                                            Reserve fund (1% of
                                                            transaction volume)
                                                            maintained.

  Card acquirer      Nuvei SA withdraws      Low            Dual acquirer
  dispute            service or increases                   strategy (Nuvei
                     MDR materially.                        primary, Network
                                                            International
                                                            secondary) from
                                                            Year 2. Contracts
                                                            include 12-month
                                                            notice clauses.

  Sponsor bank exit  Nedbank or Absa         Low            Two sponsor bank
                     withdraws TPPP                         options from Day 1.
                     sponsorship agreement.                 SARB direct
                                                            participation as
                                                            long-term hedge.
                                                            Contract minimum
                                                            36-month term.
  ------------------ ----------------------- -------------- -------------------

**15. Conclusion**

The Groway GoPay Engine is not a commodity payment gateway --- it is the
foundational infrastructure layer that makes every other Groway product
possible. Without a reliable, compliant, and scalable payment engine,
there is no merchant POS, no consumer wallet, no GroCredit, and no
GroSupply.

This plan defines a clear, executable path: launch with a PayShap + QR +
VAS core in Month 6, achieve PCI-DSS Level 2 certification by Month 6
and Level 1 by Month 18, obtain SARB TPPP licence by Month 18, and scale
to 10,000 TPS by Year 3 --- all within the R75M raise budget.

The gateway becomes a standalone profit centre by Year 3, generating
R40M+ in net contribution from transaction and VAS revenue alone. This
is before any contribution from SaaS subscriptions, GroCredit interest,
or GroSupply marketplace fees.

  ------------- ---------------------------------------------------------------------
  **CONTACT**   For technical questions on the GoPay Engine architecture, contact
                Motheto Selepe, Founder & CEO: bridge@groway.co.za \| groway.co.za

  ------------- ---------------------------------------------------------------------
