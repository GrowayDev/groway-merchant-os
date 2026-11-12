+-----------------------------------------------------------------------+
| **groway**                                                            |
|                                                                       |
| **UI/UX Improvement Analysis**                                        |
|                                                                       |
| Consumer App & Merchant OS                                            |
|                                                                       |
| ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                         |
|                                                                       |
| Based on v1.0 Design Guide + Prototype Review                         |
|                                                                       |
| *Benchmarked against: Alipay · WeChat · Revolut · Grab · Paytm ·      |
| Gojek · M-Pesa*                                                       |
|                                                                       |
| February 2026 \| Confidential                                         |
+-----------------------------------------------------------------------+

**Design Maturity Scorecard**

The following scores reflect the current state of the Groway UI/UX
against global superapp benchmarks. Scores are based on review of the
v1.0 Design Guide and HTML prototype.

+-----------+-----------+-----------+-----------+-----------+-----------+
| **8/10**  | **6/10**  | **5/10**  | **4/10**  | **7/10**  | **5/10**  |
|           |           |           |           |           |           |
| Design    | Consumer  | Merchant  | E         | Acce      | Offline / |
| System    | UX        | UX        | ngagement | ssibility | Perf      |
+-----------+-----------+-----------+-----------+-----------+-----------+

+---+---------------------------------------------------------------------+
| ★ | **Overall Assessment**                                              |
|   |                                                                     |
|   | Groway has a strong design foundation --- the token system, color   |
|   | language, and core payment flows are well-conceived. However,       |
|   | critical engagement layers (loyalty, social, personalization),      |
|   | merchant intelligence features, and several consumer-side trust and |
|   | onboarding patterns lag behind best-in-class platforms. This        |
|   | document details every gap and its fix.                             |
+---+---------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **👤 PART 1 --- CONSUMER APP IMPROVEMENTS**                           |
|                                                                       |
| *Groway Wallet · Home · Pay · History · Savings*                      |
+-----------------------------------------------------------------------+

**1.1 Home Screen --- Missing Engagement & Trust Layers**

The v1.0 home screen covers the essential layout (balance card, quick
actions, service grid, transactions) and the prototype confirms the
basic structure is in place. However, compared to Alipay, Grab, and
Revolut, several critical engagement and personalisation layers are
absent.

+-------+--------------------------------+-----------------------------+
| **    | **Gap Identified**             | **Recommended Improvement** |
| Prior |                                |                             |
| ity** |                                |                             |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P0** |                                |                             |
|       | No rewards balance or loyalty  | Add a \'Groway Points\'     |
| Lo    | tier visible on home screen.   | pill badge directly under   |
| yalty | Users have no persistent       | the balance card --- show   |
|       | motivation signal.             | current points + tier       |
|       |                                | (Bronze/Silver/Gold). Tap   |
|       |                                | to expand rewards hub.      |
|       |                                |                             |
|       |                                | *Inspired by: GrabRewards,  |
|       |                                | Alipay Sesame*              |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P0** |                                |                             |
|       | No empty state or progressive  | Add a profile completion    |
| Onboa | completion UI for new users. A | bar (\'Your wallet is 60%   |
| rding | blank balance card is cold and | set up\') with step         |
|       | trust-killing on day 1.        | prompts: Verify ID → Link   |
|       |                                | Bank → Enable Biometrics.   |
|       |                                | Disappears once complete.   |
|       |                                |                             |
|       |                                | *Inspired by: Revolut,      |
|       |                                | M-Pesa*                     |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P0** |                                |                             |
|       | The prototype shows both a     | Consolidate to one row:     |
| Quick | \'Quick Actions\' row AND a    | Send \| Receive \| Scan \|  |
| Ac    | second duplicate row inside    | Top Up. Remove the          |
| tions | the services area              | duplicated row. Reserve the |
|       | (Send/Receive/Scan/Pay appear  | services grid strictly for  |
|       | twice). This is visual noise.  | lifestyle/utility services. |
|       |                                |                             |
|       |                                | *Inspired by: Alipay,       |
|       |                                | Paytm*                      |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P1** |                                |                             |
|       | Service grid is static --- all | Add long-press              |
| Perso | users see the same 8 tiles in  | drag-to-reorder on service  |
| nalis | the same order. No user-driven | tiles (like Gojek). Pin the |
| ation | customisation.                 | top 4 most-used services    |
|       |                                | automatically. Show         |
|       |                                | \'Customise\' hint on first |
|       |                                | open.                       |
|       |                                |                             |
|       |                                | *Inspired by: Gojek,        |
|       |                                | Alipay*                     |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P1** |                                |                             |
|       | No financial summary or spend  | Add a \'This month\'        |
| Fina  | insight on home screen. Users  | mini-summary below the      |
| ncial | must navigate to history to    | balance card: spent vs      |
| H     | understand their financial     | received, with a single tap |
| ealth | position.                      | to full analytics. 2-line   |
|       |                                | max, no chart needed at     |
|       |                                | home level.                 |
|       |                                |                             |
|       |                                | *Inspired by: Revolut,      |
|       |                                | Paytm*                      |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P1** |                                |                             |
|       | Notification bell exists but   | Define notification         |
| No    | no spec for what it surfaces.  | categories: Transaction     |
| tific | No alert count badge defined.  | alerts, Offers, Security,   |
| ation | No mention of push             | System. Bell should show    |
| Hub   | notification strategy.         | red badge with count.       |
|       |                                | Swipe-to-dismiss in         |
|       |                                | notification drawer.        |
|       |                                |                             |
|       |                                | *Inspired by: WeChat,       |
|       |                                | Revolut*                    |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P2** |                                |                             |
|       | No social/community signals.   | Add a subtle \'X friends on |
| S     | Users can\'t see if friends    | Groway\' nudge + \'Invite & |
| ocial | are on Groway, which slows     | earn\' banner in services   |
| Proof | peer-to-peer growth in the     | grid. Shown only first 30   |
|       | African social context.        | days.                       |
|       |                                |                             |
|       |                                | *Inspired by: WeChat,       |
|       |                                | M-Pesa*                     |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P2** |                                |                             |
|       | Design guide specifies dark    | Validate gradient           |
| Dark  | mode but the prototype is      | (teal→green) on dark        |
| Mode  | light-only. The balance card   | surface (#1A1A1A). Add      |
| Home  | gradient on dark surfaces      | brightness detection to     |
|       | isn\'t tested.                 | auto-switch, and manual     |
|       |                                | toggle in header bar.       |
|       |                                |                             |
|       |                                | *Inspired by: Revolut,      |
|       |                                | Gojek*                      |
+-------+--------------------------------+-----------------------------+

**1.2 Pay / Send Flow --- Friction & Missing Safety Nets**

+-------+--------------------------------+-----------------------------+
| **    | **Gap Identified**             | **Recommended Improvement** |
| Prior |                                |                             |
| ity** |                                |                             |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P0** |                                |                             |
|       | No wrong-number safety check.  | After entering a number not |
| S     | If a user types a phone number | in contacts, show: \'This   |
| afety | incorrectly, money sends to a  | person is not in your       |
|       | stranger with no warning.      | contacts. Are you sure?\'   |
|       |                                | with recipient name/avatar  |
|       |                                | from Groway DB if matched,  |
|       |                                | or a hard warning if        |
|       |                                | unmatched.                  |
|       |                                |                             |
|       |                                | *Inspired by: M-Pesa,       |
|       |                                | Alipay*                     |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P0** |                                |                             |
|       | No preset amount chips. Users  | Add preset chips above      |
| A     | must manually type every       | keypad: R50 \| R100 \| R200 |
| mount | amount on the keypad --- slow  | \| R500. Tapping auto-fills |
| UX    | and error-prone for common     | the amount field. Saves 4+  |
|       | amounts.                       | keystrokes on common        |
|       |                                | transactions.               |
|       |                                |                             |
|       |                                | *Inspired by: Grab, Paytm*  |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P1** |                                |                             |
|       | No repeat payment              | Add \'Repeat this payment\' |
| Recu  | functionality. A user paying   | toggle on success screen.   |
| rring | rent or school fees monthly    | Saved repeating payments    |
| Tx    | must re-enter all details      | surface in a \'Scheduled\'  |
|       | every time.                    | tab in transaction history. |
|       |                                |                             |
|       |                                | *Inspired by: Revolut,      |
|       |                                | Standard Bank SA*           |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P1** |                                |                             |
|       | No bill splitting flow.        | Add \'Split with others\'   |
| Split | Critical in the social African | CTA on the send screen.     |
| Bills | context --- group meals,       | Select contacts, input      |
|       | transport, shared household    | amounts or split equally.   |
|       | expenses.                      | Each participant gets a     |
|       |                                | payment request.            |
|       |                                |                             |
|       |                                | *Inspired by: WeChat,       |
|       |                                | Splitwise model*            |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P1** |                                |                             |
|       | Design guide specifies \'Slide | Implement the slide gesture |
| Slide | to Pay\' biometric confirm but | as specced --- it reduces   |
| to    | this interaction is not        | accidental confirms vs a    |
| Pay   | reflected in the prototype     | simple tap button and       |
|       | confirm screen.                | creates a memorable brand   |
|       |                                | moment.                     |
|       |                                |                             |
|       |                                | *Inspired by: Revolut,      |
|       |                                | Apple Pay*                  |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P2** |                                |                             |
|       | No clear display of daily      | Show remaining daily limit  |
| Tra   | transfer limits. Users         | in small text under the     |
| nsfer | discover limits only when a    | amount field: \'Daily       |
| L     | transaction fails --- high     | limit: R10,000 --- R9,500   |
| imits | frustration moment.            | remaining.\' Tap to view    |
|       |                                | full limits.                |
|       |                                |                             |
|       |                                | *Inspired by: Revolut, FNB  |
|       |                                | SA*                         |
+-------+--------------------------------+-----------------------------+

**1.3 Transaction History --- Weak Insight Layer**

+-------+--------------------------------+-----------------------------+
| **    | **Gap Identified**             | **Recommended Improvement** |
| Prior |                                |                             |
| ity** |                                |                             |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P0** |                                |                             |
|       | No search in transaction       | Add persistent search bar   |
| S     | history. As history grows,     | at top of history screen.   |
| earch | users have no way to find a    | Search by name, amount,     |
|       | specific payment without       | merchant, or reference      |
|       | scrolling endlessly.           | number. Results highlight   |
|       |                                | matched text.               |
|       |                                |                             |
|       |                                | *Inspired by: Revolut,      |
|       |                                | Alipay*                     |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P1** |                                |                             |
|       | Category tags are spec\'d but  | Auto-categorise by merchant |
| Cat   | no auto-categorisation logic   | type: Food, Transport,      |
| egory | is defined. Without this, tags | Bills, Shopping, Transfer.  |
| Tags  | are empty labels.              | Allow user to re-assign     |
|       |                                | category. Show              |
|       |                                | spend-by-category in        |
|       |                                | monthly summary.            |
|       |                                |                             |
|       |                                | *Inspired by: Revolut,      |
|       |                                | Monzo*                      |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P1** |                                |                             |
|       | No export function for         | Add \'Export\' button in    |
| E     | consumer transaction history.  | history --- CSV and PDF     |
| xport | Users need this for tax,       | options. Email delivery     |
|       | expense claims, or personal    | within 60 seconds. 3-month  |
|       | budgeting.                     | history free, 12 months for |
|       |                                | premium.                    |
|       |                                |                             |
|       |                                | *Inspired by: Revolut,      |
|       |                                | Capitec SA*                 |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P2** |                                |                             |
|       | No transaction dispute or      | Add a \'Report a problem\'  |
| Di    | \'Something\'s wrong\' flow    | option inside Transaction   |
| spute | for consumers. Fraud reporting | Detail sheet. Categories:   |
| Flow  | path is undefined.             | Not me \| Wrong amount \|   |
|       |                                | Not received \| Other.      |
|       |                                | Feeds into support ticket.  |
|       |                                |                             |
|       |                                | *Inspired by: Revolut, FNB  |
|       |                                | SA*                         |
+-------+--------------------------------+-----------------------------+

**1.4 Savings & Invest --- Weak Motivation Architecture**

+-------+--------------------------------+-----------------------------+
| **    | **Gap Identified**             | **Recommended Improvement** |
| Prior |                                |                             |
| ity** |                                |                             |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P0** |                                |                             |
|       | Savings goals exist but there  | Add \'Auto-Save\' rules:    |
| Goals | is no automated \'round-up\'   | Round up every transaction  |
|       | or auto-save feature. Manual   | to nearest R10 and save the |
|       | savings requires willpower --- | difference. Or: Save R\[X\] |
|       | most users won\'t use it       | every Friday.               |
|       | consistently.                  | Set-and-forget = consistent |
|       |                                | engagement.                 |
|       |                                |                             |
|       |                                | *Inspired by: Monzo,        |
|       |                                | Revolut, TymeBank SA*       |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P1** |                                |                             |
|       | Savings goals are private and  | Add \'Group Save\'          |
| S     | individual. No group or        | (stokvel-style): create a   |
| ocial | community savings --- a major  | group goal, invite members, |
| Goals | cultural pattern (stokvel) in  | track each person\'s        |
|       | the African market.            | contribution. Huge          |
|       |                                | differentiator for Groway   |
|       |                                | in Africa.                  |
|       |                                |                             |
|       |                                | *Inspired by: No major app  |
|       |                                | does this well ---          |
|       |                                | first-mover advantage*      |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P1** |                                |                             |
|       | Savings progress bar exists    | Add milestone celebrations: |
| Pro   | but no celebration, milestone, | confetti animation at 25%,  |
| gress | or reward when a goal is       | 50%, 75%, 100% of goal.     |
| Ga    | reached. Progress feels        | Unlock a badge. Notify      |
| mific | clinical.                      | contacts if user chooses to |
| ation |                                | share.                      |
|       |                                |                             |
|       |                                | *Inspired by: Duolingo      |
|       |                                | model, Grab*                |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P2** |                                |                             |
|       | No interest rate display on    | Show annual interest rate   |
| Int   | savings. Users don\'t know     | clearly on each savings     |
| erest | what return they\'re getting   | goal card. Show \'You\'ve   |
| Di    | --- reduces motivation to save | earned R\[X\] interest this |
| splay | in-app vs a bank.              | month\' as a positive       |
|       |                                | reinforcement card.         |
|       |                                |                             |
|       |                                | *Inspired by: TymeBank,     |
|       |                                | Revolut*                    |
+-------+--------------------------------+-----------------------------+

+---+---------------------------------------------------------------------+
| 💡 | **Consumer Summary**                                               |
|   |                                                                     |
|   | The consumer app has solid bones but is missing three critical      |
|   | layers: (1) engagement architecture --- loyalty, gamification,      |
|   | social features that make users return daily; (2) safety nets ---   |
|   | wrong number warnings, limit visibility, dispute flows; (3)         |
|   | intelligent defaults --- auto-save, auto-categorise, preset         |
|   | amounts. These gaps are exactly what separates a payments app from  |
|   | a true superapp.                                                    |
+---+---------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **🏪 PART 2 --- MERCHANT OS IMPROVEMENTS**                            |
|                                                                       |
| *Dashboard · POS · Inventory · Analytics · Payroll*                   |
+-----------------------------------------------------------------------+

**2.1 Merchant Dashboard --- Data Without Intelligence**

The merchant dashboard is data-forward as specced, but the current
design stops at data display. Best-in-class merchant platforms (Alipay
Business, Square, Gojek for Merchant) layer intelligence on top of data
--- surfacing what the numbers mean, not just what they are.

+-------+--------------------------------+-----------------------------+
| **    | **Gap Identified**             | **Recommended Improvement** |
| Prior |                                |                             |
| ity** |                                |                             |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P0** |                                |                             |
|       | Dashboard shows revenue and    | Add a plain-language        |
| AI    | transaction count but offers   | insight card above the      |
| In    | no insight into what the       | revenue chart: \'Today is   |
| sight | numbers mean. A merchant       | tracking 18% above your     |
|       | seeing \'R24,870\' has no      | typical Tuesday. Peak hour  |
|       | context for whether that\'s    | (12--2pm) contributed 34%   |
|       | good, bad, or expected.        | of revenue.\'               |
|       |                                | Auto-generated, no charts   |
|       |                                | needed.                     |
|       |                                |                             |
|       |                                | *Inspired by: Paytm for     |
|       |                                | Business, Square*           |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P0** |                                |                             |
|       | No settlement status or payout | Add a \'Next payout\' card: |
| Settl | schedule visible on dashboard. | \'R24,870 settles to FNB    |
| ement | Merchants constantly worry     | \*4521 tomorrow by 10am.\'  |
|       | about when money reaches their | Show pending vs settled     |
|       | bank account.                  | balance clearly. Green when |
|       |                                | on track, amber if delayed. |
|       |                                |                             |
|       |                                | *Inspired by: Stripe, Yoco  |
|       |                                | SA, iKhokha*                |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P0** |                                |                             |
|       | Alerts banner is listed last   | Move alerts banner to TOP   |
| A     | in the dashboard layout ---    | of dashboard, above revenue |
| lerts | below charts and live feed.    | hero. Use color hierarchy:  |
| Pri   | Critical alerts (low stock,    | red for critical, amber for |
| ority | KYC due, settlement failed)    | warnings, teal for info.    |
|       | will be missed.                | Swipe to dismiss            |
|       |                                | non-critical.               |
|       |                                |                             |
|       |                                | *Inspired by: Square,       |
|       |                                | Shopify POS*                |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P1** |                                |                             |
|       | Revenue shows \'↑ 18% vs       | Add comparison toggle under |
| Compa | yesterday\' but no             | revenue: vs Yesterday \| vs |
| rison | week-over-week,                | Last Week \| vs Last Month. |
|       | month-over-month, or           | One tap to switch. Colour   |
|       | same-day-last-week comparison. | code: green = up, red =     |
|       | Single comparison is           | down vs chosen period.      |
|       | misleading.                    |                             |
|       |                                | *Inspired by: Gojek         |
|       |                                | Merchant, Alipay Business*  |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P1** |                                |                             |
|       | Dashboard tracks transaction   | Add \'Unique customers      |
| Cus   | count but not unique customer  | today: 38 (14 returning)\'  |
| tomer | count. Merchants can\'t        | as a secondary metric.      |
| Count | distinguish between 52         | Requires Groway user        |
|       | transactions and 52 customers  | identification --- a key    |
|       | --- critical for loyalty       | value proposition of        |
|       | strategy.                      | platform payments.          |
|       |                                |                             |
|       |                                | *Inspired by: Square,       |
|       |                                | Shopify*                    |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P1** |                                |                             |
|       | No daily revenue goal or       | Allow merchant to set a     |
| Goals | target. Merchants have no      | daily revenue target. Show  |
| /     | motivational benchmark to work | progress bar toward target  |
| Ta    | toward during the trading day. | on dashboard. \'R15,130 to  |
| rgets |                                | today\'s target --- you\'re |
|       |                                | 61% there!\' Creates        |
|       |                                | urgency.                    |
|       |                                |                             |
|       |                                | *Inspired by: Paytm,        |
|       |                                | Shopify*                    |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P2** |                                |                             |
|       | Spec says offline-capable but  | Add a persistent connection |
| Of    | there is no visible            | status dot in the top bar:  |
| fline | offline/online indicator on    | green = live, amber =       |
| Indi  | the merchant dashboard. A      | syncing, red = offline      |
| cator | merchant in an area with       | (queuing transactions).     |
|       | patchy connectivity can\'t     | Show last sync time when    |
|       | tell if their data is live.    | offline.                    |
|       |                                |                             |
|       |                                | *Inspired by: Square,       |
|       |                                | iKhokha SA*                 |
+-------+--------------------------------+-----------------------------+

**2.2 Accept Payment (POS) --- Missing Checkout Intelligence**

+-------+--------------------------------+-----------------------------+
| **    | **Gap Identified**             | **Recommended Improvement** |
| Prior |                                |                             |
| ity** |                                |                             |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P0** |                                |                             |
|       | POS is single-item only ---    | Add a \'Add items\' mode to |
| B     | merchant enters one amount     | the POS: merchant can add   |
| asket | with an optional description.  | multiple line items from    |
|       | Real merchants sell multiple   | inventory (or type custom   |
|       | items. There is no basket/cart | items), with a running      |
|       | concept.                       | total. \'Checkout\'         |
|       |                                | generates the final QR.     |
|       |                                |                             |
|       |                                | *Inspired by: Square POS,   |
|       |                                | Shopify, Yoco*              |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P0** |                                |                             |
|       | No quick-access to frequent    | Add \'Quick charge\'        |
| Saved | transaction amounts or items.  | presets --- merchant can    |
| Am    | A fruit vendor selling bananas | save their 5 most common    |
| ounts | for R15 all day must type R15  | amounts (e.g. R15, R50,     |
|       | every single transaction.      | R150). One tap on the POS   |
|       |                                | home to start a             |
|       |                                | transaction.                |
|       |                                |                             |
|       |                                | *Inspired by: Square,       |
|       |                                | PayFast SA*                 |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P1** |                                |                             |
|       | No tip prompt for service      | After amount entry,         |
| Tips  | businesses (restaurants,       | merchant can optionally     |
|       | salons, delivery). A major     | enable tip prompt --- shown |
|       | revenue driver for merchants   | to customer on the QR/await |
|       | and a common feature in SA     | screen: 10% \| 15% \| 20%   |
|       | hospitality.                   | \| Custom \| No tip.        |
|       |                                |                             |
|       |                                | *Inspired by: Square,       |
|       |                                | iKhokha, Toast POS*         |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P1** |                                |                             |
|       | No discount or promotion       | Add a \'Apply discount\'    |
| Disc  | application in the POS flow.   | option on the checkout      |
| ounts | Merchants running sales or     | screen: percentage off or   |
|       | loyalty promotions have no     | fixed amount. Record        |
|       | in-app mechanism.              | discount in transaction for |
|       |                                | analytics.                  |
|       |                                |                             |
|       |                                | *Inspired by: Shopify,      |
|       |                                | Square*                     |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P1** |                                |                             |
|       | Refund is listed as a quick    | Refund flow: Search by      |
| R     | action on the dashboard but    | transaction ID or phone     |
| efund | the refund flow is undefined.  | number → Show original      |
| from  | This is a high-risk operation  | transaction → Confirm       |
| POS   | that needs careful UX design.  | refund amount (full or      |
|       |                                | partial) → Double-confirm   |
|       |                                | (biometric) → Send refund   |
|       |                                | receipt.                    |
|       |                                |                             |
|       |                                | *Inspired by: Revolut,      |
|       |                                | Square, Stripe*             |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P2** |                                |                             |
|       | The \'Send Link\' option       | Add a \'Payment Link\'      |
| QR    | exists in the awaiting screen  | mode: merchant enters       |
| Link  | but is underspecified.         | amount + description →      |
| Sh    | Digital-first merchants        | generates a short URL they  |
| aring | (Instagram sellers, WhatsApp   | can share anywhere. Link    |
|       | traders) need a shareable      | opens Groway (or web        |
|       | payment link.                  | fallback) for customer to   |
|       |                                | pay.                        |
|       |                                |                             |
|       |                                | *Inspired by: PayShap SA,   |
|       |                                | Peach Payments*             |
+-------+--------------------------------+-----------------------------+

**2.3 Inventory --- Passive Catalogue, Not Active Commerce Tool**

+-------+--------------------------------+-----------------------------+
| **    | **Gap Identified**             | **Recommended Improvement** |
| Prior |                                |                             |
| ity** |                                |                             |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P0** |                                |                             |
|       | Stock count turns red when \<  | Send a push notification    |
| Stock | 5 but there is no proactive    | when stock hits the         |
| A     | push alert. A merchant who is  | threshold: \'iPhone Charger |
| lerts | out of stock discovers it when | is running low (3 left).    |
|       | a customer tries to buy.       | Reorder now?\' With a       |
|       |                                | direct link to reorder from |
|       |                                | GroSupply if integrated.    |
|       |                                |                             |
|       |                                | *Inspired by: Shopify,      |
|       |                                | Square, Lightspeed*         |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P1** |                                |                             |
|       | Inventory tracks price and     | Add \'Cost price\' field    |
| P     | stock count but not cost       | alongside selling price.    |
| rofit | price, so there\'s no profit   | Show margin % on each       |
| M     | margin visibility. Merchant    | product card. Dashboard     |
| argin | can\'t tell if they\'re        | aggregates to show total    |
|       | actually profitable.           | margin for the period.      |
|       |                                |                             |
|       |                                | *Inspired by: Shopify,      |
|       |                                | WooCommerce*                |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P1** |                                |                             |
|       | The design guide references    | Add a \'Reorder\' button on |
| GroS  | the GroSupply partner app but  | low-stock items that        |
| upply | there is no inventory reorder  | deep-links into GroSupply   |
| Link  | integration between Groway     | with the product            |
|       | Merchant and GroSupply.        | pre-selected. Creates a     |
|       |                                | powerful ecosystem lock-in. |
|       |                                |                             |
|       |                                | *Inspired by: Alibaba B2B,  |
|       |                                | Shopify*                    |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P2** |                                |                             |
|       | No product variants (size,     | Add variant groups to       |
| Var   | colour, flavour). A clothing   | product creation: Attribute |
| iants | merchant or food vendor can\'t | (Size) → Options (S, M, L)  |
|       | list \'T-shirt --- Small /     | → individual price/stock    |
|       | Medium / Large\' as one        | per variant. Barcode per    |
|       | product.                       | variant.                    |
|       |                                |                             |
|       |                                | *Inspired by: Shopify,      |
|       |                                | Square, WooCommerce*        |
+-------+--------------------------------+-----------------------------+

**2.4 Analytics --- Charts Without Recommendations**

+-------+--------------------------------+-----------------------------+
| **    | **Gap Identified**             | **Recommended Improvement** |
| Prior |                                |                             |
| ity** |                                |                             |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P0** |                                |                             |
|       | Analytics has charts (revenue, | Above every chart, add a    |
| AI    | top products, peak hours       | plain-language insight      |
| Ins   | heatmap) but no AI-generated   | generated from the data:    |
| ights | recommendations. Data without  | \'Your top seller is Phone  |
|       | guidance is underused by       | Cases but your margin is    |
|       | non-technical merchants.       | only 12%. Consider          |
|       |                                | increasing the price by     |
|       |                                | R20.\' Powered by Claude    |
|       |                                | API.                        |
|       |                                |                             |
|       |                                | *Inspired by: Shopify       |
|       |                                | Analytics, Square Insights* |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P0** |                                |                             |
|       | No customer lifetime value,    | Add a \'Top Customers\'     |
| Cus   | retention, or repeat-purchase  | panel: ranked by total      |
| tomer | metric. Merchant can\'t        | spend. Each entry shows:    |
| LTV   | identify their most valuable   | name (if Groway user) /     |
|       | customers.                     | anonymous, total spend,     |
|       |                                | visit frequency, last       |
|       |                                | visit. Tap to send a        |
|       |                                | loyalty offer.              |
|       |                                |                             |
|       |                                | *Inspired by: Square,       |
|       |                                | Shopify, Yoco*              |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P1** |                                |                             |
|       | Only raw transaction counts    | Add simple retention view:  |
| C     | --- no cohort or retention     | \'New customers this month: |
| ohort | analysis. Merchant doesn\'t    | 34. Returning: 28. Lost     |
| Ana   | know if their customer base is | (not seen in 60 days):      |
| lysis | growing or churning.           | 12.\' Traffic light         |
|       |                                | colours. No jargon.         |
|       |                                |                             |
|       |                                | *Inspired by: Shopify,      |
|       |                                | Lightspeed*                 |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P1** |                                |                             |
|       | Export is manual (CSV/PDF on   | Add weekly/monthly email    |
| Sche  | demand). Busy merchants won\'t | report scheduling. Simple   |
| duled | remember to export. No         | toggle: \'Email me a        |
| Re    | automated report delivery.     | summary every Monday        |
| ports |                                | morning.\' Report includes  |
|       |                                | revenue, top products,      |
|       |                                | customer count.             |
|       |                                |                             |
|       |                                | *Inspired by: Shopify, Sage |
|       |                                | SA, Xero*                   |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P2** |                                |                             |
|       | No tax-ready reporting. In     | Add a \'Tax\' tab in        |
| Tax   | South Africa, merchants need   | analytics: VAT-exclusive    |
| Su    | VAT-compliant records. This is | and VAT-inclusive revenue,  |
| mmary | a significant pain point and a | auto-calculated from        |
|       | differentiation opportunity.   | transactions. Exportable in |
|       |                                | SARS-compatible format.     |
|       |                                |                             |
|       |                                | *Inspired by: Xero, Sage,   |
|       |                                | Quickbooks*                 |
+-------+--------------------------------+-----------------------------+

**2.5 Missing Merchant Features --- Not in the Current Spec**

The following features exist in every top-tier merchant platform but are
not referenced anywhere in the v1.0 design guide. These are strategic
gaps.

+-------+--------------------------------+-----------------------------+
| **    | **What\'s Missing**            | **Why It Matters & What to  |
| Gap** |                                | Build**                     |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P0** |                                |                             |
|       | No public merchant profile or  | Give each merchant a Groway |
| Mer   | storefront. Groway merchants   | profile page: logo, name,   |
| chant | are invisible to consumers     | category, location          |
| Pr    | searching for local            | (optional), products,       |
| ofile | businesses.                    | payment QR. Discoverable in |
|       |                                | the consumer Explore tab.   |
|       |                                |                             |
|       |                                | *Inspired by: Grab, Alipay  |
|       |                                | Mini-Programs*              |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P0** |                                |                             |
|       | No way for merchants to reward | Merchant-side loyalty       |
| Lo    | repeat customers. Every        | builder: set a punch card   |
| yalty | Grab/Alipay merchant has a     | (buy 9, get 1 free) or      |
| Pr    | stamp-card or points mechanism | points multiplier. Consumer |
| ogram | --- Groway has nothing.        | sees their stamps/points on |
|       |                                | the merchant\'s profile.    |
|       |                                |                             |
|       |                                | *Inspired by: Grab          |
|       |                                | Merchant, Paytm for         |
|       |                                | Business*                   |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P1** |                                |                             |
|       | Staff/Payroll exists in nav    | Role-based access: Owner    |
| Staff | but the design guide has no    | (full access) \| Manager    |
| P     | permissions model. A cashier   | (no payroll) \| Cashier     |
| ermis | should not have access to      | (POS only, no refunds). PIN |
| sions | analytics or be able to issue  | per staff member for        |
|       | refunds.                       | accountability.             |
|       |                                |                             |
|       |                                | *Inspired by: Square,       |
|       |                                | Shopify POS*                |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P1** |                                |                             |
|       | No business loan or cash       | Show a \'Business Advance\' |
| Wo    | advance product. The \'Loans\' | card on dashboard when      |
| rking | tile exists on the consumer    | merchant qualifies (based   |
| Ca    | app but not the merchant side  | on transaction history):    |
| pital | --- a massive missed           | \'You qualify for up to     |
|       | opportunity.                   | R50,000. Apply in 2         |
|       |                                | minutes.\'                  |
|       |                                |                             |
|       |                                | *Inspired by: Paytm, Square |
|       |                                | Capital, Yoco Capital*      |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P2** |                                |                             |
|       | No multi-branch or             | Allow an owner account to   |
| Mult  | multi-location support. A      | manage multiple             |
| i-Loc | merchant with 2 shops has to   | \'locations\' under one     |
| ation | manage two completely separate | login. Dashboard shows      |
|       | accounts.                      | aggregate + per-location    |
|       |                                | revenue. Staff assigned to  |
|       |                                | locations.                  |
|       |                                |                             |
|       |                                | *Inspired by: Square,       |
|       |                                | Shopify, Lightspeed*        |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P2** |                                |                             |
|       | No merchant rating or review   | After a Groway Pay          |
| R     | system. Consumers can\'t       | transaction, prompt         |
| eview | assess merchant quality,       | consumer: \'How was your    |
| /     | reducing discovery value.      | experience at Kojo\'s       |
| R     |                                | Electronics? ★★★★★\'        |
| ating |                                | Merchant sees aggregate     |
|       |                                | rating on their profile.    |
|       |                                |                             |
|       |                                | *Inspired by: Grab, Alipay* |
+-------+--------------------------------+-----------------------------+

+---+---------------------------------------------------------------------+
| 💡 | **Merchant Summary**                                               |
|   |                                                                     |
|   | The Merchant OS has a functional POS and a reasonable dashboard     |
|   | foundation --- but it\'s currently positioned as a payment          |
|   | terminal, not a business operating system. To compete with Square,  |
|   | Yoco, and Shopify in the African market, Groway needs to add: (1)   |
|   | AI-generated business insights, (2) a full merchant                 |
|   | discovery/loyalty layer for the consumer app, (3) basket/multi-item |
|   | POS, and (4) a working capital product. These are not nice-to-haves |
|   | --- they are the features that make merchants dependent on the      |
|   | platform.                                                           |
+---+---------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **⚡ PART 3 --- CROSS-CUTTING IMPROVEMENTS**                          |
|                                                                       |
| *Onboarding · Trust · Offline · Accessibility · Engagement*           |
+-----------------------------------------------------------------------+

**3.1 Onboarding --- Cold Start Problem**

+-------+--------------------------------+-----------------------------+
| **    | **Gap Identified**             | **Recommended Improvement** |
| Prior |                                |                             |
| ity** |                                |                             |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P0** |                                |                             |
|       | No onboarding or KYC flow is   | Define a 3-step progressive |
| KYC   | specified in the design guide. | KYC: Step 1 (phone + OTP,   |
| Flow  | This is the most critical      | immediate access to receive |
|       | first impression and a massive | money). Step 2 (ID +        |
|       | trust moment --- especially in | selfie, unlocks send). Step |
|       | a fintech app.                 | 3 (proof of address,        |
|       |                                | unlocks higher limits).     |
|       |                                | Each step shows what        |
|       |                                | unlocks.                    |
|       |                                |                             |
|       |                                | *Inspired by: M-Pesa,       |
|       |                                | TymeBank SA, Grab*          |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P0** |                                |                             |
|       | No guided first top-up flow.   | Trigger a \'Welcome flow\'  |
| First | New users land on a R0 balance | on first login: show 3 ways |
| T     | with no clear guidance on how  | to top up, offer a \'First  |
| op-Up | to add money or who to pay     | deposit bonus\' incentive   |
|       | first.                         | (if applicable), and a      |
|       |                                | \'Pay someone\' prompt to   |
|       |                                | make the first payment feel |
|       |                                | safe.                       |
|       |                                |                             |
|       |                                | *Inspired by: Revolut,      |
|       |                                | Grab, Paytm*                |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P1** |                                |                             |
|       | Biometric auth is recommended  | After first successful PIN  |
| Biome | but no onboarding prompt to    | login, prompt: \'Use        |
| trics | enable it is specified. Most   | fingerprint for faster,     |
| Setup | users will skip it if not      | safer sign-in?\' Single tap |
|       | guided at the right moment.    | to enable. If declined,     |
|       |                                | re-prompt after 3rd PIN     |
|       |                                | login.                      |
|       |                                |                             |
|       |                                | *Inspired by: Revolut,      |
|       |                                | Apple Pay, Standard Bank*   |
+-------+--------------------------------+-----------------------------+

**3.2 Trust & Security Signals**

+-------+--------------------------------+-----------------------------+
| **    | **Gap Identified**             | **Recommended Improvement** |
| Prior |                                |                             |
| ity** |                                |                             |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P0** |                                |                             |
|       | No Security Centre or account  | Add a Security section      |
| Sec   | protection hub. Users have no  | under Profile: active       |
| urity | way to review active sessions, | sessions (with device       |
| C     | freeze their card, or check    | names), login history,      |
| entre | login history.                 | freeze wallet toggle        |
|       |                                | (instant), change PIN,      |
|       |                                | review trusted devices.     |
|       |                                |                             |
|       |                                | *Inspired by: Revolut,      |
|       |                                | Capitec SA, FNB*            |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P0** |                                |                             |
|       | No anti-scam prompts in the    | When sending to a           |
| Scam  | payment flow. Authorised push  | new/unverified contact:     |
| War   | payment (APP) fraud is rampant | \'Are you sure? Only send   |
| nings | in African mobile money        | money to people you know.   |
|       | markets.                       | Groway will never ask you   |
|       |                                | to send money to claim a    |
|       |                                | prize.\'                    |
|       |                                |                             |
|       |                                | *Inspired by: M-Pesa, UK    |
|       |                                | banks (mandatory), Standard |
|       |                                | Bank*                       |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P1** |                                |                             |
|       | No verified merchant or        | Add a verification badge    |
| Ve    | verified user badge. No way    | (blue tick equivalent) for  |
| rific | for consumers to know if       | KYC-verified merchants and  |
| ation | they\'re paying a legitimate   | individuals. Displayed on   |
| B     | business vs an individual.     | recipient card in payment   |
| adges |                                | confirm screen.             |
|       |                                |                             |
|       |                                | *Inspired by: Alipay, Grab, |
|       |                                | Paytm*                      |
+-------+--------------------------------+-----------------------------+

**3.3 Engagement & Retention Architecture**

+-------+--------------------------------+-----------------------------+
| **    | **Gap Identified**             | **Recommended Improvement** |
| Prior |                                |                             |
| ity** |                                |                             |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P0** |                                |                             |
|       | The entire Groway              | Define the full loyalty     |
| Lo    | loyalty/rewards system is      | architecture: point earning |
| yalty | referenced (Rewards tile in    | rules (1 point per R1       |
| S     | service grid) but has zero     | spent), tiers               |
| ystem | specification in the design    | (Br                         |
|       | guide. This is the single      | onze/Silver/Gold/Platinum), |
|       | biggest retention gap.         | redemption catalogue        |
|       |                                | (airtime, vouchers,         |
|       |                                | cashback, partner           |
|       |                                | discounts), and streak      |
|       |                                | bonuses.                    |
|       |                                |                             |
|       |                                | *Inspired by: GrabRewards,  |
|       |                                | Alipay, Paytm*              |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P1** |                                |                             |
|       | No daily engagement mechanic.  | Add a \'Daily Check-in\'    |
| Daily | Users have no reason to open   | bonus (small points for     |
| Engag | the app unless they need to    | opening the app). Show a    |
| ement | pay someone.                   | personalised \'Daily deal\' |
|       |                                | from a nearby merchant.     |
|       |                                | This drives daily opens.    |
|       |                                |                             |
|       |                                | *Inspired by: Alipay,       |
|       |                                | WeChat, Grab*               |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P1** |                                |                             |
|       | No referral or invite program  | Add \'Invite & Earn\':      |
| Ref   | specified. Word-of-mouth is    | sender gets R20 credit when |
| erral | the #1 growth channel for      | referred friend makes their |
| Pr    | mobile money in African        | first payment. Trackable    |
| ogram | markets.                       | via unique invite           |
|       |                                | link/code. Show earnings in |
|       |                                | rewards hub.                |
|       |                                |                             |
|       |                                | *Inspired by: Grab, Paytm,  |
|       |                                | M-Pesa*                     |
+-------+--------------------------------+-----------------------------+
| *     | **⚠ Gap Identified**           | **✓ Recommended Fix**       |
| *P2** |                                |                             |
|       | Push notifications are implied | Define notification         |
| Push  | but no strategy or taxonomy is | taxonomy: Transactional     |
| Str   | defined. Generic pushes get    | (always on), Promotional    |
| ategy | turned off; personalised ones  | (opt-in), Insights (\'Your  |
|       | drive action.                  | bill is due tomorrow\'),    |
|       |                                | Loyalty (\'You\'re 50       |
|       |                                | points from Silver!\').     |
|       |                                | Respect quiet hours.        |
|       |                                |                             |
|       |                                | *Inspired by: Revolut,      |
|       |                                | Grab, Paytm*                |
+-------+--------------------------------+-----------------------------+

+---+---------------------------------------------------------------------+
| ⚡ | **Cross-Cutting Priority**                                         |
|   |                                                                     |
|   | The three highest-leverage improvements that span both consumer and |
|   | merchant sides: (1) Define the full loyalty ecosystem --- it\'s     |
|   | currently a placeholder tile with no substance; (2) Build the       |
|   | anti-scam and security trust layer --- critical for African fintech |
|   | adoption; (3) Specify the complete onboarding and KYC flow ---      |
|   | every superapp lives or dies by its first 5 minutes.                |
+---+---------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **🗺 PART 4 --- IMPROVEMENT ROADMAP**                                  |
|                                                                       |
| *Prioritised by impact and implementation effort*                     |
+-----------------------------------------------------------------------+

**4.1 Now (Sprint 1--3) --- Fix Before Launch**

+-----------------------------------+-----------------------------------+
| **Consumer --- Fix Now**          | **Merchant --- Fix Now**          |
+-----------------------------------+-----------------------------------+
| -   Remove duplicate quick        | -   Move alerts banner above      |
|     actions row from home         |     revenue hero                  |
|                                   |                                   |
| -   Add wrong-number safety       | -   Add settlement status / next  |
|     warning in Send flow          |     payout card to dashboard      |
|                                   |                                   |
| -   Define + build KYC/onboarding | -   Build multi-item basket in    |
|     flow                          |     POS                           |
|                                   |                                   |
| -   Add anti-scam prompt for new  | -   Add quick-charge saved        |
|     recipient payments            |     amounts to POS                |
|                                   |                                   |
| -   Define Security Centre        | -   Define refund flow with       |
|     (freeze, sessions, PIN reset) |     biometric double-confirm      |
|                                   |                                   |
| -   Add preset amount chips on    | -   Add push alert for low stock  |
|     Send screen                   |     inventory                     |
+-----------------------------------+-----------------------------------+

**4.2 Next (Sprint 4--6) --- Competitive Parity**

+-----------------------------------+-----------------------------------+
| **Consumer --- Next**             | **Merchant --- Next**             |
+-----------------------------------+-----------------------------------+
| -   Define full loyalty points    | -   Build AI insight card on      |
|     system and tier structure     |     dashboard and analytics       |
|                                   |                                   |
| -   Build transaction search and  | -   Add customer count (unique vs |
|     auto-categorisation           |     returning) to dashboard       |
|                                   |                                   |
| -   Add profile completion bar    | -   Build merchant public profile |
|     for new users                 |     page                          |
|                                   |                                   |
| -   Add auto-save round-up rules  | -   Build merchant loyalty        |
|     to Savings                    |     stamp-card builder            |
|                                   |                                   |
| -   Build split bill flow         | -   Add tip prompt to POS flow    |
|                                   |                                   |
| -   Add recurring payment setup   | -   Build staff role permissions  |
|     on success screen             |     (owner/manager/cashier)       |
|                                   |                                   |
| -   Define + implement referral   | -   Add revenue target / daily    |
|     program                       |     goal to dashboard             |
+-----------------------------------+-----------------------------------+

**4.3 Later (Sprint 7+) --- Superapp Differentiation**

+-----------------------------------+-----------------------------------+
| **Consumer --- Differentiate**    | **Merchant --- Differentiate**    |
+-----------------------------------+-----------------------------------+
| -   Build Group Save (stokvel)    | -   Working capital / merchant    |
|     feature --- Africa-first      |     cash advance product          |
|     differentiator                |                                   |
|                                   | -   Multi-location / multi-branch |
| -   Add consumer merchant         |     account management            |
|     discovery in Explore tab      |                                   |
|                                   | -   GroSupply inventory reorder   |
| -   Consumer transaction dispute  |     integration                   |
|     flow                          |                                   |
|                                   | -   Product variants (size,       |
| -   12-month analytics export for |     colour, flavour)              |
|     premium users                 |                                   |
|                                   | -   VAT-compliant tax summary     |
| -   Daily engagement mechanic     |     export (SARS-ready)           |
|     (check-in bonus, daily deals) |                                   |
|                                   | -   Customer lifetime value and   |
| -   Dark mode full implementation |     retention analytics           |
|     and testing                   |                                   |
|                                   | -   Merchant review and rating    |
| -   FX Transfer enhancement for   |     system                        |
|     diaspora remittances          |                                   |
+-----------------------------------+-----------------------------------+

+-----------------------------------------------------------------------+
| groway --- UI/UX Improvement Analysis                                 |
|                                                                       |
| *v1.0 Design Guide Review \| February 2026 \| Confidential ---        |
| Internal Use Only*                                                    |
+-----------------------------------------------------------------------+
