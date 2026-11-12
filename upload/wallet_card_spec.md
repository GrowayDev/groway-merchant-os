+-----------------------------------------------------------------------+
| **groway**                                                            |
|                                                                       |
| **WALLET CARD**                                                       |
|                                                                       |
| AI Coding Agent Specification                                         |
|                                                                       |
| ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                    |
|                                                                       |
| Complete implementation guide for building the Groway Wallet Card UI  |
| component                                                             |
|                                                                       |
| EMV Chip (ISO/IEC 7816) · NFC (ISO/IEC 14443) · Visa & Mastercard · 4 |
| Card Tiers                                                            |
|                                                                       |
| React Native · SVG Chip · Flip Animation · Freeze/Reveal · Apple Pay  |
| / Google Pay                                                          |
|                                                                       |
| ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                    |
|                                                                       |
| Version 1.0 · March 2026 · Internal Engineering Specification ---     |
| Confidential                                                          |
+-----------------------------------------------------------------------+

+-------------+-------------+-------------+-------------+-------------+
| **4**       | **2**       | **8**       | **3**       | **12**      |
|             |             |             |             |             |
| Card Tiers  | Networks    | EMV         | Form        | Core        |
|             |             | Contacts    | Factors     | Features    |
+-------------+-------------+-------------+-------------+-------------+

+---+---------------------------------------------------------------------+
| * | **Purpose of this document**                                        |
| * |                                                                     |
| ★ | This specification is written for an AI coding agent (Cursor,       |
| * | Claude Code, GitHub Copilot, or equivalent). It contains every      |
| * | design token, component structure, animation spec, data model, API  |
|   | shape, and compliance requirement needed to build the Groway Wallet |
|   | Card UI from scratch without further clarification.                 |
+---+---------------------------------------------------------------------+

**Document Contents**

This document is structured to be read section by section by a coding
agent. Each section builds on the previous. Do not skip sections --- the
design tokens defined early are referenced throughout.

  ------------- --------------------- ----------------------------------------------
  **Section**   **Title**             **Key Deliverable**

  01            Brand & Design Tokens Colours, typography, gradients, spacing ---
                                      all hardcoded values

  02            Card Architecture     Component tree, file structure, props
                                      interface, state management

  03            EMV Chip --- SVG      Exact SVG code for ISO/IEC 7816-2 compliant
                Specification         8-contact chip

  04            NFC Symbol --- SVG    Exact SVG code for ISO/IEC 14443 contactless
                Specification         payment symbol

  05            Card Front --- Full   Every element, position, font, and colour on
                Layout Spec           the card face

  06            Card Back --- Full    Magnetic stripe, signature strip, CVV,
                Layout Spec           compliance text

  07            Flip Animation        CSS/RN 3D flip --- timing, easing, backface,
                                      perspective

  08            Card Tiers --- All    Standard, Business, Premium Gold, Virtual-only
                Four Variants         --- full spec each

  09            Network Logos ---     Pixel-accurate reproductions using only
                Visa & Mastercard     CSS/SVG

  10            Wallet Screen         Mini card, balance header, action buttons,
                Integration           transaction list

  11            Interactions & State  Freeze, reveal, tap-to-flip, shimmer, tier
                                      switching

  12            Data Model & API      CardData TypeScript interface, API endpoints,
                Contract              mock data

  13            Compliance &          PCI DSS, ISO 7816, ISO 14443, NCR, SARB ---
                Standards             what to include on card

  14            Accessibility         WCAG 2.1 AA requirements for the card
                                      component

  15            Testing Checklist     Unit, visual regression, and accessibility
                                      test requirements
  ------------- --------------------- ----------------------------------------------

+-----------------------------------------------------------------------+
| **01** ─── **Brand & Design Tokens**                                  |
|                                                                       |
| *All hardcoded values the coding agent must use --- do not invent or  |
| approximate these*                                                    |
|                                                                       |
| These tokens are non-negotiable. Every colour, gradient, font, and    |
| spacing value is specified exactly.                                   |
+-----------------------------------------------------------------------+

**1.1 Brand Identity**

The Groway brand uses a gradient that transitions from teal to green ---
matching the actual logo file (Groway_Logo_White_background\_.png). The
card must reflect this identity precisely. The logo on the card is
always rendered as gradient text, never as a flat colour and never as a
raster image.

  ---------------------- ------------------------------------------------
  **Brand name on card** groway (all lowercase --- never \"Groway\" or
                         \"GROWAY\")

  **Card product name**  Wallet Card (capitalised --- rendered at 8px,
                         uppercase, 2px letter-spacing, 55% opacity)

  **Logo render method** CSS/RN gradient text --- background:
                         linear-gradient(90deg, #00897B, #43A047).
                         -webkit-background-clip: text.

  **Logo font**          Sora Bold 700 --- import from Google Fonts.
                         Never Arial, Inter, or system font.

  **Logo font size**     22px on full card · 16px on mini wallet card ·
                         Never below 14px

  **Card name font**     Space Mono 400 --- for cardholder name, card
                         number, expiry. Monospace is mandatory.

  **Body font**          Sora 400 --- for all other card text (labels,
                         badges, CVV label)
  ---------------------- ------------------------------------------------

**1.2 Colour Tokens**

  ----------------- ------------------------ -------------------------------------------
  **Token Name**    **Hex Value**            **Usage on Card**

  TEAL_PRIMARY      #00897B                  Logo gradient start · NFC arcs · chip
                                             accent · tier badge border · label text

  GREEN_PRIMARY     #43A047                  Logo gradient end · chip highlight accents

  TEAL_DARK         #00695C                  NFC arc on card back · back-of-card text ·
                                             CVV label

  CARD_TEXT_DARK    #0A3D30                  Card number · cardholder name · expiry ·
                                             all main card text

  CARD_BG_WHITE     #FFFFFF                  Standard card gradient start (top-left)

  CARD_BG_MID       #E8F8F0                  Standard card gradient midpoint

  CARD_BG_END       #C0EDDA                  Standard card gradient end (bottom-right)

  BUSINESS_START    #F0FFFE                  Business tier gradient start

  BUSINESS_END      #60D8B8                  Business tier gradient end

  PREMIUM_START     #FFFFFF                  Premium Gold tier gradient start

  PREMIUM_END       #16A878                  Premium Gold tier gradient end (deep green)

  VIRTUAL_START     #F8FFFC                  Virtual-only tier gradient start

  VIRTUAL_END       #AAEEDD                  Virtual-only tier gradient end

  CHIP_GOLD_LIGHT   #F2D060                  EMV chip body gradient --- light stop

  CHIP_GOLD_DARK    #B88010                  EMV chip body gradient --- dark stop

  CHIP_PAD          #F8E060                  EMV contact pad fill

  CHIP_PAD_STROKE   #C89010                  EMV contact pad border

  CHIP_HIGHLIGHT    #F8E878                  EMV contact pad surface reflection
                                             highlight

  MAG_STRIPE_L      #1A3A30                  Magnetic stripe left edge colour

  MAG_STRIPE_R      #0A2A22                  Magnetic stripe right edge colour

  SIG_STRIP_BG      rgba(255,255,255,0.70)   Signature strip background

  VISA_BLUE         #1A1F71                  Visa logo colour (used on card back on
                                             white bg, and front where visible)

  MC_RED            #EB001B                  Mastercard left circle

  MC_YELLOW         #F79E1B                  Mastercard right circle

  MC_ORANGE         #FF5F00                  Mastercard overlap blend colour
  ----------------- ------------------------ -------------------------------------------

**1.3 Card Dimensions**

+---+---------------------------------------------------------------------+
| * | **ISO/IEC 7810 ID-1 Standard**                                      |
| * |                                                                     |
| 📐 | Payment cards are globally standardised at 85.6mm × 53.98mm        |
| * | (3.370\" × 2.125\"). All digital card components must maintain this |
| * | 1.586:1 aspect ratio exactly. On mobile at 375px screen width, the  |
|   | standard card renders at approximately 340px × 214px.               |
+---+---------------------------------------------------------------------+

  ---------------------- ------------------------------------------------
  **Physical standard**  ISO/IEC 7810 ID-1: 85.6mm × 53.98mm

  **Aspect ratio**       1.586 : 1 (width : height) --- must be
                         maintained at all screen sizes

  **Mobile width         340px wide × 214px tall
  (375px)**              

  **Mobile width         356px wide × 224px tall
  (390px)**              

  **Border radius**      12px at 340px width · Scale proportionally:
                         radius = width × 0.0353

  **Border**             1px solid rgba(0, 137, 123, 0.20)

  **Shadow**             Standard: 0 20px 60px rgba(0,137,123,0.18), 0
                         4px 20px rgba(0,0,0,0.10)

  **Internal padding**   24px top/bottom · 28px left/right on full card ·
                         Scale proportionally on smaller renders

  **Mini card (wallet)** 90px tall --- width fills container. Same aspect
                         ratio maintained via fixed height + 100% width.
  ---------------------- ------------------------------------------------

+-----------------------------------------------------------------------+
| **02** ─── **Card Architecture**                                      |
|                                                                       |
| *Component tree · file structure · TypeScript props interface · state |
| management*                                                           |
|                                                                       |
| The coding agent must create exactly this file structure and          |
| component hierarchy.                                                  |
+-----------------------------------------------------------------------+

**2.1 File Structure**

+-----------------------------------------------------------------------+
| *Directory tree*                                                      |
|                                                                       |
| > src/                                                                |
| >                                                                     |
| > components/                                                         |
| >                                                                     |
| > wallet/                                                             |
| >                                                                     |
| > WalletCard/ ← Top-level card component                              |
| >                                                                     |
| > index.tsx ← Default export: \<WalletCard /\>                        |
| >                                                                     |
| > WalletCard.styles.ts ← All StyleSheet definitions                   |
| >                                                                     |
| > WalletCard.types.ts ← TypeScript interfaces                         |
| >                                                                     |
| > WalletCard.constants.ts ← Tier configs, gradient stops, network     |
| > data                                                                |
| >                                                                     |
| > WalletCard.hooks.ts ← useCardFlip, useCardReveal, useCardFreeze     |
| >                                                                     |
| > WalletCard.test.tsx ← Jest + React Native Testing Library tests     |
| >                                                                     |
| > components/                                                         |
| >                                                                     |
| > CardFront.tsx ← Front face of card                                  |
| >                                                                     |
| > CardBack.tsx ← Back face of card                                    |
| >                                                                     |
| > EMVChip.tsx ← SVG EMV chip --- ISO 7816-2                           |
| >                                                                     |
| > NFCSymbol.tsx ← SVG NFC symbol --- ISO 14443                        |
| >                                                                     |
| > NetworkLogo.tsx ← Visa or Mastercard logo                           |
| >                                                                     |
| > TierBadge.tsx ← STANDARD · VIRTUAL badge pill                       |
| >                                                                     |
| > CardNumber.tsx ← Masked/revealed card number                        |
| >                                                                     |
| > ShimmerOverlay.tsx ← Animated shimmer effect                        |
| >                                                                     |
| > MiniWalletCard/ ← Compact card for wallet home screen               |
| >                                                                     |
| > index.tsx                                                           |
| >                                                                     |
| > MiniWalletCard.styles.ts                                            |
| >                                                                     |
| > WalletScreen/ ← Full wallet home screen                             |
| >                                                                     |
| > index.tsx                                                           |
| >                                                                     |
| > WalletScreen.styles.ts                                              |
+-----------------------------------------------------------------------+

**2.2 TypeScript Interfaces**

The following interfaces are the single source of truth for all card
data. The coding agent must define these in WalletCard.types.ts and
import them in every component.

+-----------------------------------------------------------------------+
| *TypeScript*                                                          |
|                                                                       |
| > // WalletCard.types.ts                                              |
| >                                                                     |
| > export type CardNetwork = \"visa\" \| \"mastercard\";               |
| >                                                                     |
| > export type CardTier = \"standard\" \| \"business\" \| \"premium\"  |
| > \| \"virtual\";                                                     |
| >                                                                     |
| > export type CardStatus = \"active\" \| \"frozen\" \| \"pending\" \| |
| > \"cancelled\";                                                      |
| >                                                                     |
| > export type CardFormFactor = \"virtual\" \| \"physical\" \|         |
| > \"metal\";                                                          |
| >                                                                     |
| > export interface CardData {                                         |
| >                                                                     |
| > // Identity                                                         |
| >                                                                     |
| > cardId: string; // UUID --- never displayed                         |
| >                                                                     |
| > merchantId: string; // UUID --- links to Groway merchant            |
| >                                                                     |
| > network: CardNetwork;                                               |
| >                                                                     |
| > tier: CardTier;                                                     |
| >                                                                     |
| > formFactor: CardFormFactor;                                         |
| >                                                                     |
| > status: CardStatus;                                                 |
| >                                                                     |
| > // Display (sensitive --- masked by default)                        |
| >                                                                     |
| > cardholderName: string; // \"M. SELEPE\" --- uppercase, Space Mono  |
| >                                                                     |
| > lastFour: string; // \"0582\" --- always visible                    |
| >                                                                     |
| > maskedNumber: string; // \"4716 •••• •••• 0582\"                    |
| >                                                                     |
| > fullNumber?: string; // Only present when revealed (from secure     |
| > API)                                                                |
| >                                                                     |
| > expiryDisplay: string; // \"09 / 29\"                               |
| >                                                                     |
| > cvv?: string; // Only present when revealed (from secure API)       |
| >                                                                     |
| > // Settings                                                         |
| >                                                                     |
| > nfcEnabled: boolean; // Drives NFC symbol visibility                |
| >                                                                     |
| > dailyLimitCents: number; // BIGINT cents --- R10,000 = 1000000      |
| >                                                                     |
| > spendingControls?: SpendControls;                                   |
| >                                                                     |
| > // Metadata                                                         |
| >                                                                     |
| > issuedAt: string; // ISO 8601                                       |
| >                                                                     |
| > expiresAt: string; // ISO 8601                                      |
| >                                                                     |
| > }                                                                   |
| >                                                                     |
| > export interface SpendControls {                                    |
| >                                                                     |
| > dailyLimitCents: number;                                            |
| >                                                                     |
| > perTransactionCents: number;                                        |
| >                                                                     |
| > internationalEnabled: boolean;                                      |
| >                                                                     |
| > onlineEnabled: boolean;                                             |
| >                                                                     |
| > contactlessEnabled: boolean;                                        |
| >                                                                     |
| > }                                                                   |
| >                                                                     |
| > export interface WalletCardProps {                                  |
| >                                                                     |
| > card: CardData;                                                     |
| >                                                                     |
| > onFreeze?: (cardId: string) =\> void;                               |
| >                                                                     |
| > onRevealDetails?:(cardId: string) =\> Promise\<{ fullNumber:        |
| > string; cvv: string }\>;                                            |
| >                                                                     |
| > onAddToWallet?: (cardId: string, wallet: \"apple\" \| \"google\")   |
| > =\> void;                                                           |
| >                                                                     |
| > onCardPress?: (cardId: string) =\> void;                            |
| >                                                                     |
| > size?: \"full\" \| \"mini\"; // default \"full\"                    |
| >                                                                     |
| > showBack?: boolean; // controlled flip (optional)                   |
| >                                                                     |
| > }                                                                   |
+-----------------------------------------------------------------------+

**2.3 State Management**

+-----------------------------------------------------------------------+
| *TypeScript*                                                          |
|                                                                       |
| > // WalletCard.hooks.ts                                              |
| >                                                                     |
| > import { useRef, useState, useCallback } from \"react\";            |
| >                                                                     |
| > import { Animated } from \"react-native\";                          |
| >                                                                     |
| > export function useCardFlip() {                                     |
| >                                                                     |
| > const flipAnim = useRef(new Animated.Value(0)).current;             |
| >                                                                     |
| > const \[isFlipped, setIsFlipped\] = useState(false);                |
| >                                                                     |
| > const flip = useCallback(() =\> {                                   |
| >                                                                     |
| > const toValue = isFlipped ? 0 : 1;                                  |
| >                                                                     |
| > Animated.spring(flipAnim, {                                         |
| >                                                                     |
| > toValue,                                                            |
| >                                                                     |
| > friction: 8, // Damping --- higher = less bouncy                    |
| >                                                                     |
| > tension: 40, // Speed --- higher = faster                           |
| >                                                                     |
| > useNativeDriver: true,                                              |
| >                                                                     |
| > }).start(() =\> setIsFlipped(!isFlipped));                          |
| >                                                                     |
| > }, \[isFlipped, flipAnim\]);                                        |
| >                                                                     |
| > const frontInterpolate = flipAnim.interpolate({                     |
| >                                                                     |
| > inputRange: \[0, 1\],                                               |
| >                                                                     |
| > outputRange: \[\"0deg\", \"180deg\"\],                              |
| >                                                                     |
| > });                                                                 |
| >                                                                     |
| > const backInterpolate = flipAnim.interpolate({                      |
| >                                                                     |
| > inputRange: \[0, 1\],                                               |
| >                                                                     |
| > outputRange: \[\"180deg\", \"360deg\"\],                            |
| >                                                                     |
| > });                                                                 |
| >                                                                     |
| > return { flip, isFlipped, frontInterpolate, backInterpolate };      |
| >                                                                     |
| > }                                                                   |
| >                                                                     |
| > export function useCardReveal(onReveal:                             |
| > WalletCardProps\[\"onRevealDetails\"\]) {                           |
| >                                                                     |
| > const \[isRevealed, setIsRevealed\] = useState(false);              |
| >                                                                     |
| > const \[revealedData, setRevealedData\] = useState\<{ fullNumber:   |
| > string; cvv: string } \| null\>(null);                              |
| >                                                                     |
| > const \[isLoading, setIsLoading\] = useState(false);                |
| >                                                                     |
| > const reveal = useCallback(async (cardId: string) =\> {             |
| >                                                                     |
| > if (isRevealed) { setIsRevealed(false); return; }                   |
| >                                                                     |
| > if (!onReveal) return;                                              |
| >                                                                     |
| > setIsLoading(true);                                                 |
| >                                                                     |
| > try {                                                               |
| >                                                                     |
| > const data = await onReveal(cardId);                                |
| >                                                                     |
| > setRevealedData(data);                                              |
| >                                                                     |
| > setIsRevealed(true);                                                |
| >                                                                     |
| > // Auto-hide after 30 seconds (PCI DSS requirement)                 |
| >                                                                     |
| > setTimeout(() =\> setIsRevealed(false), 30_000);                    |
| >                                                                     |
| > } finally {                                                         |
| >                                                                     |
| > setIsLoading(false);                                                |
| >                                                                     |
| > }                                                                   |
| >                                                                     |
| > }, \[isRevealed, onReveal\]);                                       |
| >                                                                     |
| > return { isRevealed, revealedData, isLoading, reveal };             |
| >                                                                     |
| > }                                                                   |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **03** ─── **EMV Chip --- SVG Specification**                         |
|                                                                       |
| *ISO/IEC 7816-2 compliant 8-contact layout · Gold plating simulation  |
| · Exact SVG code*                                                     |
|                                                                       |
| Copy this SVG exactly. Do not simplify, approximate, or substitute    |
| with an image.                                                        |
+-----------------------------------------------------------------------+

**3.1 What the EMV Chip Must Include**

A Payment Card Industry (PCI) compliant EMV chip visual must accurately
represent the ISO/IEC 7816-2 physical layout. This is not decorative ---
card issuer compliance reviews and user trust both require the chip to
look authentic. The following elements are mandatory.

  ------------- ------------- ----------------------------------------------
  **Element**   **ISO         **Specification**
                Reference**   

  Chip body     ISO 7816-2 §5 Rounded rectangle. 54×42px at full card size.
                              rx=5. Two-tone gold gradient (light centre,
                              darker edges).

  Contact pad   ISO 7816-2    Top-left pad. VCC power supply. 20×8px. Gold
  C1 (VCC)      §5.2          fill with highlight. Row 1, Column 1.

  Contact pad   ISO 7816-2    Reset signal. 20×8px. Row 2, Column 1.
  C2 (RST)      §5.2          

  Contact pad   ISO 7816-2    Clock signal. 20×8px. Row 3, Column 1.
  C3 (CLK)      §5.2          

  Contact pad   ISO 7816-2    Reserved for future use. 20×7px. Row 4, Column
  C4 (RFU)      §5.2          1.

  Contact pad   ISO 7816-2    Ground. 20×8px. Row 1, Column 2.
  C5 (GND)      §5.2          

  Contact pad   ISO 7816-2    Programming voltage. 20×8px. Row 2, Column 2.
  C6 (Vpp)      §5.2          

  Contact pad   ISO 7816-2    Data I/O. 20×8px. Row 3, Column 2.
  C7 (I/O)      §5.2          

  Contact pad   ISO 7816-2    Reserved for future use. 20×7px. Row 4, Column
  C8 (RFU)      §5.2          2.

  Vertical      ISO 7816-2 §5 5px wide gap between left and right pad
  channel                     columns. Filled with chip body colour.

  Pad           Visual        Each pad has a 8×2px highlight rect at
  highlights    fidelity      top-left to simulate gold plating reflection.

  Body sheen    Visual        Horizontal line across top of chip body
                fidelity      (rgba(255,248,160,0.35)) to simulate light
                              reflection.

  Inner border  Visual        1.5px inset rect, stroke #a07010 at 50%
  groove        fidelity      opacity --- gives physical depth.
  ------------- ------------- ----------------------------------------------

**3.2 EMVChip.tsx --- Complete Component Code**

+-----------------------------------------------------------------------+
| *TypeScript / React Native SVG*                                       |
|                                                                       |
| > // components/EMVChip.tsx                                           |
| >                                                                     |
| > // ISO/IEC 7816-2 compliant 8-contact EMV chip                      |
| >                                                                     |
| > import React from \"react\";                                        |
| >                                                                     |
| > import Svg, { Rect, Defs, LinearGradient, Stop, Line } from         |
| > \"react-native-svg\";                                               |
| >                                                                     |
| > interface EMVChipProps {                                            |
| >                                                                     |
| > width?: number; // default 54                                       |
| >                                                                     |
| > height?: number; // default 42                                      |
| >                                                                     |
| > }                                                                   |
| >                                                                     |
| > export const EMVChip: React.FC\<EMVChipProps\> = ({ width = 54,     |
| > height = 42 }) =\> {                                                |
| >                                                                     |
| > // Scale factor --- chip always renders proportionally              |
| >                                                                     |
| > const sx = width / 54;                                              |
| >                                                                     |
| > const sy = height / 42;                                             |
| >                                                                     |
| > const s = (x: number) =\> x \* sx;                                  |
| >                                                                     |
| > const h = (y: number) =\> y \* sy;                                  |
| >                                                                     |
| > return (                                                            |
| >                                                                     |
| > \<Svg width={width} height={height} viewBox=\"0 0 54 42\"\>         |
| >                                                                     |
| > \<Defs\>                                                            |
| >                                                                     |
| > {/\* Chip body gradient --- two-tone gold \*/}                      |
| >                                                                     |
| > \<LinearGradient id=\"chipBody\" x1=\"0\" y1=\"0\" x2=\"54\"        |
| > y2=\"42\" gradientUnits=\"userSpaceOnUse\"\>                        |
| >                                                                     |
| > \<Stop offset=\"0%\" stopColor=\"#D4A820\" /\>                      |
| >                                                                     |
| > \<Stop offset=\"22%\" stopColor=\"#F2D060\" /\>                     |
| >                                                                     |
| > \<Stop offset=\"45%\" stopColor=\"#C89418\" /\>                     |
| >                                                                     |
| > \<Stop offset=\"68%\" stopColor=\"#E8C840\" /\>                     |
| >                                                                     |
| > \<Stop offset=\"100%\" stopColor=\"#B88010\" /\>                    |
| >                                                                     |
| > \</LinearGradient\>                                                 |
| >                                                                     |
| > {/\* Contact pad gradient --- brighter gold for plated surface \*/} |
| >                                                                     |
| > \<LinearGradient id=\"padShine\" x1=\"0\" y1=\"0\" x2=\"1\"         |
| > y2=\"1\" gradientUnits=\"objectBoundingBox\"\>                      |
| >                                                                     |
| > \<Stop offset=\"0%\" stopColor=\"#F8E878\" /\>                      |
| >                                                                     |
| > \<Stop offset=\"50%\" stopColor=\"#D4A820\" /\>                     |
| >                                                                     |
| > \<Stop offset=\"100%\" stopColor=\"#A07010\" /\>                    |
| >                                                                     |
| > \</LinearGradient\>                                                 |
| >                                                                     |
| > \</Defs\>                                                           |
| >                                                                     |
| > {/\* Chip body \*/}                                                 |
| >                                                                     |
| > \<Rect x=\"0\" y=\"0\" width=\"54\" height=\"42\" rx=\"5\" ry=\"5\" |
| > fill=\"url(#chipBody)\" /\>                                         |
| >                                                                     |
| > {/\* Inner border groove --- gives depth \*/}                       |
| >                                                                     |
| > \<Rect x=\"1.5\" y=\"1.5\" width=\"51\" height=\"39\" rx=\"4\"      |
| > ry=\"4\"                                                            |
| >                                                                     |
| > fill=\"none\" stroke=\"#A07010\" strokeWidth=\"0.8\"                |
| > opacity=\"0.5\" /\>                                                 |
| >                                                                     |
| > {/\* ── LEFT COLUMN: C1, C2, C3, C4 ── \*/}                         |
| >                                                                     |
| > {/\* C1 --- VCC \*/}                                                |
| >                                                                     |
| > \<Rect x=\"4\" y=\"3\" width=\"20\" height=\"8\" rx=\"1.5\"         |
| > fill=\"url(#padShine)\" stroke=\"#C89010\" strokeWidth=\"0.6\" /\>  |
| >                                                                     |
| > {/\* C2 --- RST \*/}                                                |
| >                                                                     |
| > \<Rect x=\"4\" y=\"13\" width=\"20\" height=\"8\" rx=\"1.5\"        |
| > fill=\"url(#padShine)\" stroke=\"#C89010\" strokeWidth=\"0.6\" /\>  |
| >                                                                     |
| > {/\* C3 --- CLK \*/}                                                |
| >                                                                     |
| > \<Rect x=\"4\" y=\"23\" width=\"20\" height=\"8\" rx=\"1.5\"        |
| > fill=\"url(#padShine)\" stroke=\"#C89010\" strokeWidth=\"0.6\" /\>  |
| >                                                                     |
| > {/\* C4 --- RFU \*/}                                                |
| >                                                                     |
| > \<Rect x=\"4\" y=\"33\" width=\"20\" height=\"7\" rx=\"1.5\"        |
| > fill=\"url(#padShine)\" stroke=\"#C89010\" strokeWidth=\"0.6\" /\>  |
| >                                                                     |
| > {/\* ── RIGHT COLUMN: C5, C6, C7, C8 ── \*/}                        |
| >                                                                     |
| > {/\* C5 --- GND \*/}                                                |
| >                                                                     |
| > \<Rect x=\"30\" y=\"3\" width=\"20\" height=\"8\" rx=\"1.5\"        |
| > fill=\"url(#padShine)\" stroke=\"#C89010\" strokeWidth=\"0.6\" /\>  |
| >                                                                     |
| > {/\* C6 --- Vpp \*/}                                                |
| >                                                                     |
| > \<Rect x=\"30\" y=\"13\" width=\"20\" height=\"8\" rx=\"1.5\"       |
| > fill=\"url(#padShine)\" stroke=\"#C89010\" strokeWidth=\"0.6\" /\>  |
| >                                                                     |
| > {/\* C7 --- I/O \*/}                                                |
| >                                                                     |
| > \<Rect x=\"30\" y=\"23\" width=\"20\" height=\"8\" rx=\"1.5\"       |
| > fill=\"url(#padShine)\" stroke=\"#C89010\" strokeWidth=\"0.6\" /\>  |
| >                                                                     |
| > {/\* C8 --- RFU \*/}                                                |
| >                                                                     |
| > \<Rect x=\"30\" y=\"33\" width=\"20\" height=\"7\" rx=\"1.5\"       |
| > fill=\"url(#padShine)\" stroke=\"#C89010\" strokeWidth=\"0.6\" /\>  |
| >                                                                     |
| > {/\* ── PAD SURFACE HIGHLIGHTS --- gold plating reflection ── \*/}  |
| >                                                                     |
| > \<Rect x=\"4.5\" y=\"3.5\" width=\"8\" height=\"2\" rx=\"0.8\"      |
| > fill=\"rgba(255,248,180,0.55)\" /\>                                 |
| >                                                                     |
| > \<Rect x=\"4.5\" y=\"13.5\" width=\"8\" height=\"2\" rx=\"0.8\"     |
| > fill=\"rgba(255,248,180,0.55)\" /\>                                 |
| >                                                                     |
| > \<Rect x=\"4.5\" y=\"23.5\" width=\"8\" height=\"2\" rx=\"0.8\"     |
| > fill=\"rgba(255,248,180,0.55)\" /\>                                 |
| >                                                                     |
| > \<Rect x=\"4.5\" y=\"33.5\" width=\"8\" height=\"2\" rx=\"0.8\"     |
| > fill=\"rgba(255,248,180,0.55)\" /\>                                 |
| >                                                                     |
| > \<Rect x=\"30.5\" y=\"3.5\" width=\"8\" height=\"2\" rx=\"0.8\"     |
| > fill=\"rgba(255,248,180,0.55)\" /\>                                 |
| >                                                                     |
| > \<Rect x=\"30.5\" y=\"13.5\" width=\"8\" height=\"2\" rx=\"0.8\"    |
| > fill=\"rgba(255,248,180,0.55)\" /\>                                 |
| >                                                                     |
| > \<Rect x=\"30.5\" y=\"23.5\" width=\"8\" height=\"2\" rx=\"0.8\"    |
| > fill=\"rgba(255,248,180,0.55)\" /\>                                 |
| >                                                                     |
| > \<Rect x=\"30.5\" y=\"33.5\" width=\"8\" height=\"2\" rx=\"0.8\"    |
| > fill=\"rgba(255,248,180,0.55)\" /\>                                 |
| >                                                                     |
| > {/\* ── VERTICAL CHANNEL --- gap between pad columns ── \*/}        |
| >                                                                     |
| > \<Rect x=\"24.5\" y=\"0\" width=\"5\" height=\"42\"                 |
| > fill=\"url(#chipBody)\" /\>                                         |
| >                                                                     |
| > {/\* Body sheen --- light reflection across top \*/}                |
| >                                                                     |
| > \<Line x1=\"4\" y1=\"1.2\" x2=\"50\" y2=\"1.2\"                     |
| > stroke=\"rgba(255,248,160,0.35)\" strokeWidth=\"0.8\" /\>           |
| >                                                                     |
| > \</Svg\>                                                            |
| >                                                                     |
| > );                                                                  |
| >                                                                     |
| > };                                                                  |
+-----------------------------------------------------------------------+

**3.3 Chip Sizing by Card Size**

  --------------- ------------ ------------ -------------------------------
  **Card Width**  **Chip       **Chip       **Chip Position**
                  Width**      Height**     

  340px (375px    54px         42px         Left: 28px from card left edge
  screen)                                   · Top: 82px from card top edge

  356px (390px    57px         44px         Left: 30px · Top: 86px
  screen)                                   

  280px (mini     28px         22px         Top-right of mini card --- 12px
  card)                                     from top, 14px from right

  Scaling formula width ×      width ×      Always position in the standard
                  0.159        0.124        chip location (left-centre
                                            area)
  --------------- ------------ ------------ -------------------------------

+-----------------------------------------------------------------------+
| **04** ─── **NFC Symbol --- SVG Specification**                       |
|                                                                       |
| *ISO/IEC 14443 contactless payment symbol · Exact arc geometry ·      |
| Positioning on card*                                                  |
|                                                                       |
| The NFC symbol must use the standard 3-arc + dot format. Do not use a |
| WiFi icon or substitute.                                              |
+-----------------------------------------------------------------------+

**4.1 NFC Symbol Structure**

The contactless payment symbol is defined by EMVCo and standardised
across Visa payWave, Mastercard Contactless, and ISO/IEC 14443. It
consists of a filled circle (the tap point) and three concentric
quadrant arcs radiating outward. Each arc is progressively larger and
slightly more transparent, representing decreasing signal strength at
greater distance.

  ------------- --------------------------- ------------------- -------------
  **Element**   **Geometry**                **Colour**          **Opacity**

  Centre dot    circle cx=7 cy=16 r=2.2     #00897B             100%
                                            (TEAL_PRIMARY)      

  Arc 1 (near)  Path: M 12 10.5 Q 16 16 12  #00897B             100%
                21.5 --- quadratic Bezier                       
                curve                                           

  Arc 2 (mid)   Path: M 16.5 7.5 Q 22 16    #00897B             75%
                16.5 24.5                                       

  Arc 3 (far)   Path: M 21 4.5 Q 28 16 21   #00897B             45%
                27.5                                            

  All arcs      strokeWidth: 1.8 ·          N/A                 See above
                strokeLinecap: round ·                          
                fill: none                                      
  ------------- --------------------------- ------------------- -------------

**4.2 NFCSymbol.tsx --- Complete Component Code**

+-----------------------------------------------------------------------+
| *TypeScript / React Native SVG*                                       |
|                                                                       |
| > // components/NFCSymbol.tsx                                         |
| >                                                                     |
| > import React from \"react\";                                        |
| >                                                                     |
| > import Svg, { Circle, Path } from \"react-native-svg\";             |
| >                                                                     |
| > interface NFCSymbolProps {                                          |
| >                                                                     |
| > size?: number; // default 30 (full card) · 20 (mini card)           |
| >                                                                     |
| > color?: string; // default \"#00897B\"                              |
| >                                                                     |
| > opacity?: number; // default 0.70                                   |
| >                                                                     |
| > }                                                                   |
| >                                                                     |
| > export const NFCSymbol: React.FC\<NFCSymbolProps\> = ({             |
| >                                                                     |
| > size = 30,                                                          |
| >                                                                     |
| > color = \"#00897B\",                                                |
| >                                                                     |
| > opacity = 0.70,                                                     |
| >                                                                     |
| > }) =\> (                                                            |
| >                                                                     |
| > \<Svg width={size} height={size} viewBox=\"0 0 32 32\"              |
| > opacity={opacity}\>                                                 |
| >                                                                     |
| > {/\* Centre dot --- the tap point \*/}                              |
| >                                                                     |
| > \<Circle cx=\"7\" cy=\"16\" r=\"2.2\" fill={color} /\>              |
| >                                                                     |
| > {/\* Arc 1 --- nearest (100% opacity) \*/}                          |
| >                                                                     |
| > \<Path                                                              |
| >                                                                     |
| > d=\"M 12 10.5 Q 16 16 12 21.5\"                                     |
| >                                                                     |
| > stroke={color}                                                      |
| >                                                                     |
| > strokeWidth=\"1.8\"                                                 |
| >                                                                     |
| > strokeLinecap=\"round\"                                             |
| >                                                                     |
| > fill=\"none\"                                                       |
| >                                                                     |
| > /\>                                                                 |
| >                                                                     |
| > {/\* Arc 2 --- middle (75% opacity) \*/}                            |
| >                                                                     |
| > \<Path                                                              |
| >                                                                     |
| > d=\"M 16.5 7.5 Q 22 16 16.5 24.5\"                                  |
| >                                                                     |
| > stroke={color}                                                      |
| >                                                                     |
| > strokeWidth=\"1.8\"                                                 |
| >                                                                     |
| > strokeLinecap=\"round\"                                             |
| >                                                                     |
| > fill=\"none\"                                                       |
| >                                                                     |
| > opacity={0.75}                                                      |
| >                                                                     |
| > /\>                                                                 |
| >                                                                     |
| > {/\* Arc 3 --- outermost (45% opacity) \*/}                         |
| >                                                                     |
| > \<Path                                                              |
| >                                                                     |
| > d=\"M 21 4.5 Q 28 16 21 27.5\"                                      |
| >                                                                     |
| > stroke={color}                                                      |
| >                                                                     |
| > strokeWidth=\"1.8\"                                                 |
| >                                                                     |
| > strokeLinecap=\"round\"                                             |
| >                                                                     |
| > fill=\"none\"                                                       |
| >                                                                     |
| > opacity={0.45}                                                      |
| >                                                                     |
| > /\>                                                                 |
| >                                                                     |
| > \</Svg\>                                                            |
| >                                                                     |
| > );                                                                  |
+-----------------------------------------------------------------------+

**4.3 NFC Placement on Card**

  ------------------ ---------- ------------- ----------------------------------
  **Location**       **Size**   **Opacity**   **Label**

  Card FRONT ---     30×30px    70%           \"NFC\" text below: 7px · font
  top-right corner                            Sora · letter-spacing 2px ·
                                              uppercase · color #00897B ·
                                              opacity 70%

  Card BACK ---      22×22px    45%           No label on back
  bottom-right                                
  corner                                      

  Mini wallet card   20×20px    60%           No label on mini card
  --- top-right                               

  Apple/Google Pay   Do not     N/A           Use native wallet SDK buttons ---
  button             render                   do not replicate the NFC symbol in
                                              wallet add flows
  ------------------ ---------- ------------- ----------------------------------

+-----------------------------------------------------------------------+
| **05** ─── **Card Front --- Full Layout Specification**               |
|                                                                       |
| *Every element on the card face with exact position, size, font,      |
| colour, and z-order*                                                  |
|                                                                       |
| Build CardFront.tsx from this spec. Every measurement is relative to  |
| card width for responsiveness.                                        |
+-----------------------------------------------------------------------+

**5.1 Front Layout Map (top to bottom, left to right)**

  ------------- ------------- ---------------- ------------------------ ------------------------
  **Z-order**   **Element**   **Position**     **Size / Font**          **Colour**

  1 (bottom)    Card body     fill entire card See tier gradient table  Tier-specific
                gradient                       in §8                    

  2             Shimmer       absolute, inset  Full card ---            rgba(255,255,255,0.50)
                overlay       0                AnimatedLinearGradient   highlight band

  3             \"groway\"    Top: 24px ·      22px · Sora Bold 700     Linear gradient #00897B
                logo text     Left: 28px                                → #43A047 (text fill)

  4             \"Wallet      Top: 49px ·      8px · Sora 500 ·         #00897B at 55% opacity
                Card\"        Left: 28px       letter-spacing 2px ·     
                sub-label                      uppercase                

  5             NFC Symbol    Top: 22px ·      30×30px SVG              #00897B at 70% opacity
                              Right: 28px                               

  6             \"NFC\" text  Top: 55px ·      7px · Sora 700 ·         #00897B at 70% opacity
                label         Right: 28px,     letter-spacing 2px ·     
                              centred under    uppercase                
                              NFC icon                                  

  7             EMV Chip      Top: 82px ·      54×42px SVG              Gold gradient (see §3)
                              Left: 28px                                

  8             Card Number   Top: 148px ·     17px · Space Mono 400 ·  #0A3D30
                              Left: 28px       letter-spacing 3.5px     

  9             \"Card        Top: 184px ·     8px · Sora 400 ·         #00897B at 60% opacity
                holder\"      Left: 28px       letter-spacing 2px ·     
                label                          uppercase                

  10            Cardholder    Top: 196px ·     12px · Space Mono 400 ·  #0A3D30
                Name          Left: 28px       letter-spacing 1.5px ·   
                                               uppercase                

  11            \"Valid       Top: 184px ·     8px · Sora 400 ·         #00897B at 60% opacity
                thru\" label  Left: 148px      letter-spacing 2px ·     
                                               uppercase                

  12            Expiry Date   Top: 196px ·     12px · Space Mono 400 ·  #0A3D30
                              Left: 148px      letter-spacing 1.5px     

  13            Tier Badge    Top: 212px ·     8px · Sora 700 ·         #00695C text ·
                pill          Left: 28px       letter-spacing 2px ·     rgba(255,255,255,0.60)
                                               uppercase · pill         bg ·
                                               border-radius 20px       rgba(0,137,123,0.30)
                                                                        border

  14            Network Logo  Bottom-right:    Visa: 26px Georgia serif See §9
                              28px right ·     italic · MC: 54×34px     
                              22px bottom      overlapping circles      
  ------------- ------------- ---------------- ------------------------ ------------------------

**5.2 CardFront.tsx --- Structural Code**

+-----------------------------------------------------------------------+
| *TypeScript / React Native*                                           |
|                                                                       |
| > // components/CardFront.tsx                                         |
| >                                                                     |
| > import React from \"react\";                                        |
| >                                                                     |
| > import { View, Text, StyleSheet } from \"react-native\";            |
| >                                                                     |
| > import LinearGradient from \"react-native-linear-gradient\";        |
| >                                                                     |
| > import { EMVChip } from \"./EMVChip\";                              |
| >                                                                     |
| > import { NFCSymbol } from \"./NFCSymbol\";                          |
| >                                                                     |
| > import { NetworkLogo } from \"./NetworkLogo\";                      |
| >                                                                     |
| > import { TierBadge } from \"./TierBadge\";                          |
| >                                                                     |
| > import { CardNumber } from \"./CardNumber\";                        |
| >                                                                     |
| > import { ShimmerOverlay } from \"./ShimmerOverlay\";                |
| >                                                                     |
| > import { TIER_CONFIGS } from \"../WalletCard.constants\";           |
| >                                                                     |
| > import { CardData } from \"../WalletCard.types\";                   |
| >                                                                     |
| > interface CardFrontProps {                                          |
| >                                                                     |
| > card: CardData;                                                     |
| >                                                                     |
| > isRevealed: boolean;                                                |
| >                                                                     |
| > fullNumber?: string;                                                |
| >                                                                     |
| > }                                                                   |
| >                                                                     |
| > export const CardFront: React.FC\<CardFrontProps\> = ({ card,       |
| > isRevealed, fullNumber }) =\> {                                     |
| >                                                                     |
| > const tierConfig = TIER_CONFIGS\[card.tier\];                       |
| >                                                                     |
| > return (                                                            |
| >                                                                     |
| > \<LinearGradient                                                    |
| >                                                                     |
| > colors={tierConfig.gradientColors}                                  |
| >                                                                     |
| > start={{ x: 0, y: 0 }}                                              |
| >                                                                     |
| > end={{ x: 1, y: 1 }}                                                |
| >                                                                     |
| > angle={140}                                                         |
| >                                                                     |
| > style={styles.cardBody}                                             |
| >                                                                     |
| > \>                                                                  |
| >                                                                     |
| > \<ShimmerOverlay /\>                                                |
| >                                                                     |
| > {/\* Row 1: Logo + NFC \*/}                                         |
| >                                                                     |
| > \<View style={styles.topRow}\>                                      |
| >                                                                     |
| > \<View\>                                                            |
| >                                                                     |
| > \<Text style={styles.logoText}\>groway\</Text\>                     |
| >                                                                     |
| > \<Text style={styles.logoSub}\>Wallet Card\</Text\>                 |
| >                                                                     |
| > \</View\>                                                           |
| >                                                                     |
| > {card.nfcEnabled && (                                               |
| >                                                                     |
| > \<View style={styles.nfcContainer}\>                                |
| >                                                                     |
| > \<NFCSymbol size={30} /\>                                           |
| >                                                                     |
| > \<Text style={styles.nfcLabel}\>NFC\</Text\>                        |
| >                                                                     |
| > \</View\>                                                           |
| >                                                                     |
| > )}                                                                  |
| >                                                                     |
| > \</View\>                                                           |
| >                                                                     |
| > {/\* Row 2: EMV Chip \*/}                                           |
| >                                                                     |
| > \<View style={styles.chipRow}\>                                     |
| >                                                                     |
| > \<EMVChip width={54} height={42} /\>                                |
| >                                                                     |
| > \</View\>                                                           |
| >                                                                     |
| > {/\* Row 3: Card Number \*/}                                        |
| >                                                                     |
| > \<CardNumber                                                        |
| >                                                                     |
| > maskedNumber={card.maskedNumber}                                    |
| >                                                                     |
| > fullNumber={fullNumber}                                             |
| >                                                                     |
| > isRevealed={isRevealed}                                             |
| >                                                                     |
| > /\>                                                                 |
| >                                                                     |
| > {/\* Row 4: Holder + Expiry + Network \*/}                          |
| >                                                                     |
| > \<View style={styles.bottomRow}\>                                   |
| >                                                                     |
| > \<View style={styles.holderSection}\>                               |
| >                                                                     |
| > \<View style={styles.fieldGroup}\>                                  |
| >                                                                     |
| > \<Text style={styles.fieldLabel}\>Card holder\</Text\>              |
| >                                                                     |
| > \<Text style={styles.fieldValue}\>{card.cardholderName}\</Text\>    |
| >                                                                     |
| > \</View\>                                                           |
| >                                                                     |
| > \<View style={\[styles.fieldGroup, styles.expiryGroup\]}\>          |
| >                                                                     |
| > \<Text style={styles.fieldLabel}\>Valid thru\</Text\>               |
| >                                                                     |
| > \<Text style={styles.fieldValue}\>{card.expiryDisplay}\</Text\>     |
| >                                                                     |
| > \</View\>                                                           |
| >                                                                     |
| > \<TierBadge tier={card.tier} formFactor={card.formFactor} /\>       |
| >                                                                     |
| > \</View\>                                                           |
| >                                                                     |
| > \<NetworkLogo network={card.network} variant=\"front\" /\>          |
| >                                                                     |
| > \</View\>                                                           |
| >                                                                     |
| > \</LinearGradient\>                                                 |
| >                                                                     |
| > );                                                                  |
| >                                                                     |
| > };                                                                  |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **06** ─── **Card Back --- Full Layout Specification**                |
|                                                                       |
| *Magnetic stripe · signature strip · CVV · compliance text · NFC on   |
| back*                                                                 |
|                                                                       |
| The back face is revealed on flip. It shares the same gradient as the |
| front.                                                                |
+-----------------------------------------------------------------------+

**6.1 Back Layout Map (top to bottom)**

  --------------- ---------------- ---------------- ------------------------
  **Element**     **Position**     **Dimensions**   **Colour & Style**

  Gradient        Full card        Same as front    Tier-specific gradient
  background                       but slightly     
                                   deeper ---       
                                   darken gradient  
                                   end by 15%       

  Magnetic stripe Top: 32px · Full 46px height      Linear gradient: #1A3A30
                  width                             → #0A2A22 · left to
                                                    right

  Signature strip Top: 90px ·      Height: 38px     rgba(255,255,255,0.70)
  container       Left: 28px ·                      background · border: 1px
                  Right: 28px                       solid
                                                    rgba(0,137,123,0.15) ·
                                                    border-radius 4px

  Signature lines Inside sig strip Full strip width rgba(0,137,123,0.20)
  (3x)            · vertically     × 1px each · gap 
                  centred with     5px between      
                  spacing          lines            

  CVV box         Inside sig strip \~60px wide ×    White background ·
                  · right-aligned  28px tall ·      border: 1px solid
                  · right: 10px    border-radius    rgba(0,137,123,0.20) ·
                                   3px              font: Space Mono 700
                                                    14px, letter-spacing 3px
                                                    · color #0A3D30

  \"CVV2\" /      Top: 132px ·     8px · Sora 400 · #00897B at 55% opacity ·
  \"CVC2\" label  Right: 40px      letter-spacing   text-align right
                                   2px · uppercase  

  Legal           Top: 152px ·     8px · Sora 400 · #00695C at 50% opacity
  disclaimer      Left: 28px ·     line-height 1.65 
                  Right: 28px                       

  Bank name /     Bottom: 16px ·   8px · Sora 400 · #00695C at 55% opacity
  compliance      Left: 28px       line-height 1.70 

  NFC symbol      Bottom: 16px ·   22×22px SVG      #00695C at 45% opacity
  (back)          Right: 28px                       

  Network logo    Bottom: 16px ·   Visa: white-bg   See §9
  (back)          Right: 28px      pill with blue   
                  (above NFC       text · MC:       
                  symbol)          smaller circles  
  --------------- ---------------- ---------------- ------------------------

**6.2 Compliance Text --- Exact Wording**

+---+---------------------------------------------------------------------+
| * | **Use this exact text**                                             |
| * |                                                                     |
| ! | The disclaimer text on the back is legally reviewed. Do not         |
| * | paraphrase or shorten it.                                           |
| * |                                                                     |
+---+---------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| *TypeScript*                                                          |
|                                                                       |
| > // WalletCard.constants.ts --- BACK_DISCLAIMER                      |
| >                                                                     |
| > export const BACK_DISCLAIMER =                                      |
| >                                                                     |
| > \"This card is issued by Groway Financial Services (Pty) Ltd under  |
| > licence from \" +                                                   |
| >                                                                     |
| > \"Visa/Mastercard International. EMV chip compliant --- ISO/IEC     |
| > 7816 & 14443. \" +                                                  |
| >                                                                     |
| > \"Accepted at all Visa/Mastercard chip and NFC terminals worldwide. |
| > \" +                                                                |
| >                                                                     |
| > \"Subject to Groway Wallet terms and conditions.\";                 |
| >                                                                     |
| > export const BACK_BANK_LINE =                                       |
| >                                                                     |
| > \"Groway Financial Services (Pty) Ltd · support.groway.app · 0800   |
| > GROWAY\";                                                           |
| >                                                                     |
| > export const BACK_COMPLIANCE_LINE =                                 |
| >                                                                     |
| > \"PCI DSS L1 · NCR Reg. · SARB Auth. · POPIA Compliant\";           |
| >                                                                     |
| > // CVV label changes by network                                     |
| >                                                                     |
| > export const CVV_LABEL: Record\<CardNetwork, string\> = {           |
| >                                                                     |
| > visa: \"CVV2\",                                                     |
| >                                                                     |
| > mastercard: \"CVC2\",                                               |
| >                                                                     |
| > };                                                                  |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **07** ─── **Flip Animation**                                         |
|                                                                       |
| *3D card flip using React Native Animated API · perspective ·         |
| backface visibility*                                                  |
|                                                                       |
| This is the primary card interaction. It must feel physical and       |
| premium.                                                              |
+-----------------------------------------------------------------------+

**7.1 Animation Parameters**

  ---------------------- ------------------------------------------------
  **Animation type**     React Native Animated.spring() --- spring
                         physics, not timing

  **Friction**           8 --- controls damping (bounciness). Do not
                         reduce below 7.

  **Tension**            40 --- controls speed. Do not exceed 60.

  **useNativeDriver**    true --- mandatory for 60fps on Android

  **Perspective**        1200px --- applied to the scene container
                         (parent of both faces)

  **Backface hidden**    true on both faces --- prevents bleeding through

  **Front rotateY**      interpolate: \[0,1\] → \[\"0deg\", \"180deg\"\]

  **Back rotateY**       interpolate: \[0,1\] → \[\"180deg\",
                         \"360deg\"\]

  **Trigger**            Tap anywhere on the card ---
                         TouchableWithoutFeedback wrapping the scene

  **Double-tap guard**   Disable tap handler while animation is in
                         progress using an isAnimating ref
  ---------------------- ------------------------------------------------

**7.2 WalletCard.tsx --- Full Flip Integration**

+-----------------------------------------------------------------------+
| *TypeScript / React Native*                                           |
|                                                                       |
| > // index.tsx --- WalletCard root component                          |
| >                                                                     |
| > import React, { useRef } from \"react\";                            |
| >                                                                     |
| > import { Animated, TouchableWithoutFeedback, View, StyleSheet }     |
| > from \"react-native\";                                              |
| >                                                                     |
| > import { CardFront } from \"./components/CardFront\";               |
| >                                                                     |
| > import { CardBack } from \"./components/CardBack\";                 |
| >                                                                     |
| > import { useCardFlip } from \"./WalletCard.hooks\";                 |
| >                                                                     |
| > import { WalletCardProps } from \"./WalletCard.types\";             |
| >                                                                     |
| > import { CARD_ASPECT_RATIO } from \"./WalletCard.constants\";       |
| >                                                                     |
| > export const WalletCard: React.FC\<WalletCardProps\> = ({ card,     |
| > onRevealDetails, size = \"full\" }) =\> {                           |
| >                                                                     |
| > const { flip, frontInterpolate, backInterpolate } = useCardFlip();  |
| >                                                                     |
| > const isAnimatingRef = useRef(false);                               |
| >                                                                     |
| > const cardWidth = size === \"mini\" ? undefined : undefined; // set |
| > via layout                                                          |
| >                                                                     |
| > const handleFlip = () =\> {                                         |
| >                                                                     |
| > if (isAnimatingRef.current) return;                                 |
| >                                                                     |
| > isAnimatingRef.current = true;                                      |
| >                                                                     |
| > flip();                                                             |
| >                                                                     |
| > setTimeout(() =\> { isAnimatingRef.current = false; }, 750);        |
| >                                                                     |
| > };                                                                  |
| >                                                                     |
| > const frontAnimatedStyle = {                                        |
| >                                                                     |
| > transform: \[{ perspective: 1200 }, { rotateY: frontInterpolate     |
| > }\],                                                                |
| >                                                                     |
| > };                                                                  |
| >                                                                     |
| > const backAnimatedStyle = {                                         |
| >                                                                     |
| > transform: \[{ perspective: 1200 }, { rotateY: backInterpolate }\], |
| >                                                                     |
| > };                                                                  |
| >                                                                     |
| > return (                                                            |
| >                                                                     |
| > \<TouchableWithoutFeedback onPress={handleFlip}\>                   |
| >                                                                     |
| > \<View style={styles.scene}\>                                       |
| >                                                                     |
| > {/\* FRONT \*/}                                                     |
| >                                                                     |
| > \<Animated.View style={\[styles.face, frontAnimatedStyle\]}\>       |
| >                                                                     |
| > \<CardFront card={card} isRevealed={false} /\>                      |
| >                                                                     |
| > \</Animated.View\>                                                  |
| >                                                                     |
| > {/\* BACK \*/}                                                      |
| >                                                                     |
| > \<Animated.View style={\[styles.face, styles.backFace,              |
| > backAnimatedStyle\]}\>                                              |
| >                                                                     |
| > \<CardBack card={card} /\>                                          |
| >                                                                     |
| > \</Animated.View\>                                                  |
| >                                                                     |
| > \</View\>                                                           |
| >                                                                     |
| > \</TouchableWithoutFeedback\>                                       |
| >                                                                     |
| > );                                                                  |
| >                                                                     |
| > };                                                                  |
| >                                                                     |
| > const styles = StyleSheet.create({                                  |
| >                                                                     |
| > scene: {                                                            |
| >                                                                     |
| > width: \"100%\",                                                    |
| >                                                                     |
| > aspectRatio: CARD_ASPECT_RATIO, // 1.586                            |
| >                                                                     |
| > },                                                                  |
| >                                                                     |
| > face: {                                                             |
| >                                                                     |
| > position: \"absolute\",                                             |
| >                                                                     |
| > width: \"100%\",                                                    |
| >                                                                     |
| > height: \"100%\",                                                   |
| >                                                                     |
| > backfaceVisibility: \"hidden\",                                     |
| >                                                                     |
| > borderRadius: 12,                                                   |
| >                                                                     |
| > overflow: \"hidden\",                                               |
| >                                                                     |
| > },                                                                  |
| >                                                                     |
| > backFace: {                                                         |
| >                                                                     |
| > // backface starts hidden --- rotateY handles visibility            |
| >                                                                     |
| > },                                                                  |
| >                                                                     |
| > });                                                                 |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **08** ─── **Card Tiers --- All Four Variants**                       |
|                                                                       |
| *Standard · Business · Premium Gold · Virtual-only · gradient stops · |
| limits · badge text*                                                  |
|                                                                       |
| Define TIER_CONFIGS in WalletCard.constants.ts. Every tier difference |
| is specified here.                                                    |
+-----------------------------------------------------------------------+

**8.1 Tier Configuration Object**

+-----------------------------------------------------------------------+
| *TypeScript*                                                          |
|                                                                       |
| > // WalletCard.constants.ts                                          |
| >                                                                     |
| > export const CARD_ASPECT_RATIO = 1.586; // ISO/IEC 7810 ID-1        |
| >                                                                     |
| > export const TIER_CONFIGS = {                                       |
| >                                                                     |
| > standard: {                                                         |
| >                                                                     |
| > displayName: \"Standard\",                                          |
| >                                                                     |
| > badgeText: \"STANDARD · VIRTUAL\",                                  |
| >                                                                     |
| > gradientColors: \[\"#FFFFFF\", \"#E8F8F0\", \"#C0EDDA\"\],          |
| >                                                                     |
| > gradientAngle: 140,                                                 |
| >                                                                     |
| > borderColor: \"rgba(0, 137, 123, 0.20)\",                           |
| >                                                                     |
| > shadowColor: \"rgba(0, 137, 123, 0.18)\",                           |
| >                                                                     |
| > dailyLimitZAR: 10_000,                                              |
| >                                                                     |
| > atmLimitZAR: 3_000,                                                 |
| >                                                                     |
| > formFactor: \"virtual\",                                            |
| >                                                                     |
| > fxFeePct: 2.5,                                                      |
| >                                                                     |
| > rewardMultiplier: 1.0,                                              |
| >                                                                     |
| > },                                                                  |
| >                                                                     |
| > business: {                                                         |
| >                                                                     |
| > displayName: \"Business\",                                          |
| >                                                                     |
| > badgeText: \"BUSINESS · MERCHANT\",                                 |
| >                                                                     |
| > gradientColors: \[\"#F0FFFE\", \"#CFF5EB\", \"#8FE8D0\",            |
| > \"#60D8B8\"\],                                                      |
| >                                                                     |
| > gradientAngle: 140,                                                 |
| >                                                                     |
| > borderColor: \"rgba(0, 137, 123, 0.25)\",                           |
| >                                                                     |
| > shadowColor: \"rgba(0, 137, 123, 0.22)\",                           |
| >                                                                     |
| > dailyLimitZAR: 100_000,                                             |
| >                                                                     |
| > atmLimitZAR: 10_000,                                                |
| >                                                                     |
| > formFactor: \"physical\",                                           |
| >                                                                     |
| > fxFeePct: 1.5,                                                      |
| >                                                                     |
| > rewardMultiplier: 1.5,                                              |
| >                                                                     |
| > },                                                                  |
| >                                                                     |
| > premium: {                                                          |
| >                                                                     |
| > displayName: \"Premium Gold\",                                      |
| >                                                                     |
| > badgeText: \"PREMIUM GOLD\",                                        |
| >                                                                     |
| > gradientColors: \[\"#FFFFFF\", \"#D8F5EC\", \"#88E0C4\",            |
| > \"#38C498\", \"#16A878\"\],                                         |
| >                                                                     |
| > gradientAngle: 140,                                                 |
| >                                                                     |
| > borderColor: \"rgba(0, 137, 123, 0.30)\",                           |
| >                                                                     |
| > shadowColor: \"rgba(0, 137, 123, 0.28)\",                           |
| >                                                                     |
| > dailyLimitZAR: 500_000,                                             |
| >                                                                     |
| > atmLimitZAR: 25_000,                                                |
| >                                                                     |
| > formFactor: \"metal\",                                              |
| >                                                                     |
| > fxFeePct: 0, // 0% for first R50k/month                             |
| >                                                                     |
| > fxFreeMonthlyZAR: 50_000,                                           |
| >                                                                     |
| > rewardMultiplier: 2.0,                                              |
| >                                                                     |
| > },                                                                  |
| >                                                                     |
| > virtual: {                                                          |
| >                                                                     |
| > displayName: \"Virtual-only\",                                      |
| >                                                                     |
| > badgeText: \"VIRTUAL-ONLY\",                                        |
| >                                                                     |
| > gradientColors: \[\"#F8FFFC\", \"#DAF7EE\", \"#AAEEDD\"\],          |
| >                                                                     |
| > gradientAngle: 140,                                                 |
| >                                                                     |
| > borderColor: \"rgba(0, 137, 123, 0.18)\",                           |
| >                                                                     |
| > shadowColor: \"rgba(0, 137, 123, 0.14)\",                           |
| >                                                                     |
| > dailyLimitZAR: 5_000,                                               |
| >                                                                     |
| > atmLimitZAR: 0, // No ATM access                                    |
| >                                                                     |
| > formFactor: \"virtual\",                                            |
| >                                                                     |
| > fxFeePct: 2.5,                                                      |
| >                                                                     |
| > rewardMultiplier: 1.0,                                              |
| >                                                                     |
| > },                                                                  |
| >                                                                     |
| > } as const;                                                         |
| >                                                                     |
| > export type TierConfigKey = keyof typeof TIER_CONFIGS;              |
+-----------------------------------------------------------------------+

**8.2 Tier Visual Differences Summary**

  -------------- ---------------- ------------- ---------------- -------------
  **Tier**       **Gradient       **Badge       **Network        **Physical
                 Depth**          Style**       Options**        Card**

  Standard       Light ---        Small pill ·  Visa OR          No ---
                 barely-there     thin border   Mastercard (one) virtual only
                 green wash                                      (add-on R99)

  Business       Medium ---       Same pill ·   Visa +           Yes ---
                 mid-green teal   slightly      Mastercard       standard
                 sweep            richer bg     (both)           physical

  Premium Gold   Rich --- deep    Same pill ·   Visa +           Yes --- metal
                 forest green at  prominent     Mastercard       card
                 bottom-right                   (both)           

  Virtual-only   Very light ---   Same pill ·   Visa OR          No ---
                 almost white     lightest bg   Mastercard (one) digital only
                 mint                                            forever
  -------------- ---------------- ------------- ---------------- -------------

+-----------------------------------------------------------------------+
| **09** ─── **Network Logos --- Visa & Mastercard**                    |
|                                                                       |
| *Pixel-accurate reproduction using only CSS/RN styles and SVG --- no  |
| raster images*                                                        |
|                                                                       |
| Card network logos must follow brand guidelines. These                |
| implementations are pre-approved.                                     |
+-----------------------------------------------------------------------+

**9.1 Visa Logo Specification**

The Visa wordmark uses a specific serif italic font. On the card front,
it is rendered directly in the Visa brand blue. On the card back, it
sits on a white pill background to ensure contrast against any card
gradient.

  ---------------------- ------------------------------------------------
  **Font**               Georgia, \"Times New Roman\", serif --- in that
                         priority order

  **Style**              italic · font-weight 900 (if available) or bold

  **Size --- front**     26px

  **Size --- back**      17px (inside white pill)

  **Colour --- front**   #1A1F71 (Visa dark blue)

  **Colour --- back**    #1A1F71 on white background pill: borderRadius
                         5px · paddingHorizontal 10px · paddingVertical
                         3px

  **Letter spacing**     -1px (tight --- matches Visa wordmark
                         proportions)

  **Text content**       \"VISA\" --- always all-caps
  ---------------------- ------------------------------------------------

+-----------------------------------------------------------------------+
| *TypeScript / React Native*                                           |
|                                                                       |
| > // In NetworkLogo.tsx --- Visa rendering                            |
| >                                                                     |
| > const VisaLogo = ({ variant }: { variant: \"front\" \| \"back\" })  |
| > =\> {                                                               |
| >                                                                     |
| > if (variant === \"back\") {                                         |
| >                                                                     |
| > return (                                                            |
| >                                                                     |
| > \<View style={styles.visaBackPill}\>                                |
| >                                                                     |
| > \<Text style={\[styles.visaText,                                    |
| > styles.visaTextBack\]}\>VISA\</Text\>                               |
| >                                                                     |
| > \</View\>                                                           |
| >                                                                     |
| > );                                                                  |
| >                                                                     |
| > }                                                                   |
| >                                                                     |
| > return \<Text style={styles.visaText}\>VISA\</Text\>;               |
| >                                                                     |
| > };                                                                  |
| >                                                                     |
| > const styles = StyleSheet.create({                                  |
| >                                                                     |
| > visaText: {                                                         |
| >                                                                     |
| > fontFamily: \"Georgia\", // Falls back to system serif on Android   |
| >                                                                     |
| > fontStyle: \"italic\",                                              |
| >                                                                     |
| > fontWeight: \"900\",                                                |
| >                                                                     |
| > fontSize: 26,                                                       |
| >                                                                     |
| > letterSpacing: -1,                                                  |
| >                                                                     |
| > color: \"#1A1F71\",                                                 |
| >                                                                     |
| > },                                                                  |
| >                                                                     |
| > visaTextBack: { fontSize: 17 },                                     |
| >                                                                     |
| > visaBackPill: {                                                     |
| >                                                                     |
| > backgroundColor: \"#FFFFFF\",                                       |
| >                                                                     |
| > borderRadius: 5,                                                    |
| >                                                                     |
| > paddingHorizontal: 10,                                              |
| >                                                                     |
| > paddingVertical: 3,                                                 |
| >                                                                     |
| > },                                                                  |
| >                                                                     |
| > });                                                                 |
+-----------------------------------------------------------------------+

**9.2 Mastercard Logo Specification**

The Mastercard logo is three overlapping circles --- red left, yellow
right, orange overlap in the centre. This is built from three
absolutely-positioned View elements inside a relative container. No SVG
or image required.

  ---------------------- ------------------------------------------------
  **Container**          position: relative · width: 54px · height: 34px
                         (front) · 42×26px (back)

  **Left circle**        position: absolute · left: 0 · width: 34px ·
                         height: 34px · borderRadius: 17px ·
                         backgroundColor: #EB001B

  **Right circle**       position: absolute · left: 18px · width: 34px ·
                         height: 34px · borderRadius: 17px ·
                         backgroundColor: #F79E1B

  **Overlap strip**      position: absolute · left: 18px · width: 15px ·
                         height: 34px · backgroundColor: #FF5F00 (blended
                         orange)

  **Back variant**       Scale proportionally: container 42×26 · circles
                         26px diameter · overlap strip left: 14px width:
                         12px

  **Opacity**            0.95 on all three elements --- slight
                         transparency is accurate to Mastercard brand
  ---------------------- ------------------------------------------------

+-----------------------------------------------------------------------+
| *TypeScript / React Native*                                           |
|                                                                       |
| > // In NetworkLogo.tsx --- Mastercard rendering                      |
| >                                                                     |
| > const MastercardLogo = ({ variant }: { variant: \"front\" \|        |
| > \"back\" }) =\> {                                                   |
| >                                                                     |
| > const isBack = variant === \"back\";                                |
| >                                                                     |
| > const size = isBack ? 26 : 34;                                      |
| >                                                                     |
| > const w = isBack ? 42 : 54;                                         |
| >                                                                     |
| > const overlapLeft = isBack ? 14 : 18;                               |
| >                                                                     |
| > const overlapW = isBack ? 12 : 15;                                  |
| >                                                                     |
| > return (                                                            |
| >                                                                     |
| > \<View style={{ position: \"relative\", width: w, height: size }}\> |
| >                                                                     |
| > \<View style={\[styles.mcCircle, { left: 0, width: size, height:    |
| > size,                                                               |
| >                                                                     |
| > borderRadius: size / 2, backgroundColor: \"#EB001B\" }\]} /\>       |
| >                                                                     |
| > \<View style={\[styles.mcCircle, { left: overlapLeft, width: size,  |
| > height: size,                                                       |
| >                                                                     |
| > borderRadius: size / 2, backgroundColor: \"#F79E1B\" }\]} /\>       |
| >                                                                     |
| > \<View style={{ position: \"absolute\", left: overlapLeft, width:   |
| > overlapW,                                                           |
| >                                                                     |
| > height: size, backgroundColor: \"#FF5F00\", opacity: 0.95 }} /\>    |
| >                                                                     |
| > \</View\>                                                           |
| >                                                                     |
| > );                                                                  |
| >                                                                     |
| > };                                                                  |
| >                                                                     |
| > const styles = StyleSheet.create({                                  |
| >                                                                     |
| > mcCircle: {                                                         |
| >                                                                     |
| > position: \"absolute\",                                             |
| >                                                                     |
| > opacity: 0.95,                                                      |
| >                                                                     |
| > },                                                                  |
| >                                                                     |
| > });                                                                 |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **10** ─── **Wallet Screen Integration**                              |
|                                                                       |
| *How WalletCard integrates into the Groway consumer wallet home       |
| screen*                                                               |
|                                                                       |
| The wallet screen has three zones: header (balance), card zone (mini  |
| card), and body (actions + transactions).                             |
+-----------------------------------------------------------------------+

**10.1 Screen Architecture**

  -------------- ----------------- ----------------- ---------------------------------
  **Zone**       **Component**     **Background**    **Content**

  Header         WalletHeader      Linear gradient:  \"groway\" logo · \"Wallet Card\"
                                   #0D1B2A → #0A2E28 sub-label · Account number ·
                                   (dark brand)      Active badge · Balance display

  Card Zone      MiniWalletCard    Inherits parent   Mini card (90px height, 100%
                                   (white/surface)   width) · tap to reveal number ·
                                                     EMV chip (28×22px) · NFC symbol
                                                     (20px) · masked number ·
                                                     cardholder · expiry · network
                                                     logo

  Actions Row    ActionGrid        Surface secondary Pay · Top Up · Transfer · Freeze
                                                     --- 4 equal-width buttons in a
                                                     row

  Transactions   TransactionList   Surface primary   \"Recent transactions\" label ·
                                                     scrollable list of tx items
  -------------- ----------------- ----------------- ---------------------------------

**10.2 Mini Card Specification**

The MiniWalletCard is the compact representation of the card on the
wallet home screen. It is not a separate design system --- it uses the
same gradient, same logo rendering, same fonts, and same chip as the
full card, just scaled down.

  ---------------------- ------------------------------------------------
  **Height**             90px fixed · width: 100% of parent container

  **Border radius**      14px

  **Padding**            11px top/bottom · 15px left/right

  **Logo**               \"groway\" gradient text · 16px Sora Bold · same
                         gradient as full card

  **Sub-label**          \"Wallet Card · {tier display name}\" · 7px ·
                         Sora · letter-spacing 2px · uppercase · 55%
                         opacity · #00897B

  **EMV chip**           28×22px --- positioned top-right corner · 12px
                         from top · 14px from right

  **NFC symbol**         20×20px · placed to the left of the EMV chip ·
                         same colour and opacity rules

  **Card number**        Space Mono 11px · letter-spacing 2px · #0A3D30 ·
                         masked by default (\"4716 •••• •••• 0582\")

  **Cardholder**         Space Mono 9px · letter-spacing 1px · uppercase
                         · #0A3D30 · 65% opacity

  **Expiry**             Same line as cardholder: \"M. Selepe · 09/29\"

  **Network logo**       Right-aligned · Visa: font-size 15px · MC:
                         42×26px scaled circles

  **Tap to reveal**      Tap mini card → toggle masked/full number.
                         Auto-mask after 30 seconds.

  **Shadow**             0 4px 16px rgba(0, 137, 123, 0.12)

  **Border**             1px solid rgba(0, 137, 123, 0.20)
  ---------------------- ------------------------------------------------

**10.3 Action Buttons**

  ------------ ----------- -------------- ------------------------------------------
  **Button**   **Icon**    **Label**      **onPress Action**

  Pay          ↑ (unicode  \"Pay\"        Navigate to payment flow with card
               arrow up)                  pre-selected

  Top Up       ↓ (unicode  \"Top up\"     Navigate to top-up flow
               arrow down)                

  Transfer     ⇌ (unicode  \"Transfer\"   Navigate to transfer flow
               arrows)                    

  Freeze       Snowflake   \"Freeze\"     Call onFreeze(card.cardId) · update
               icon                       card.status to \"frozen\" · button shows
               (custom)                   \"Unfreeze\" when frozen · colour changes
                                          to danger red
  ------------ ----------- -------------- ------------------------------------------

+-----------------------------------------------------------------------+
| **11** ─── **Interactions & State**                                   |
|                                                                       |
| *Every user interaction, its trigger, animation, and resulting state  |
| change*                                                               |
|                                                                       |
| All state changes must update the UI immediately and call the         |
| relevant callback prop.                                               |
+-----------------------------------------------------------------------+

**11.1 Interaction Map**

  ----------------- -------------- ------------------------ ---------------- -------------------------
  **Interaction**   **Trigger**    **Animation**            **State Change** **Callback**

  Flip card         Tap full card  Animated.spring rotateY  isFlipped: false onCardPress(cardId)
                                   0→180°. Duration         → true (and      
                                   \~700ms.                 back)            

  Reveal number     Tap mini card  Fade transition 200ms ·  isRevealed:      Calls
                    or \"Reveal\"  number text crossfades   false → true.    onRevealDetails(cardId)
                    button                                  Shows            async --- awaits secure
                                                            fullNumber. 30s  API
                                                            auto-hide timer  
                                                            starts.          

  Mask number       Tap again OR   Fade transition 200ms    isRevealed:      None
                    30s timer                               false            
                    expires                                                  

  Freeze card       Tap Freeze     Button colour            card.status:     onFreeze(cardId)
                    button         transitions to danger    \"active\" →     
                                   red 200ms                \"frozen\". NFC  
                                                            disabled. Number 
                                                            reveal disabled. 

  Unfreeze card     Tap Unfreeze   Button colour returns to card.status:     onFreeze(cardId)
                    button (when   normal 200ms             \"frozen\" →     (toggles)
                    frozen)                                 \"active\"       

  Shimmer           Continuous --- AnimatedLinearGradient   No state change  None
                    loops on mount sweeps left to right.    --- purely       
                                   Loop every 4s.           visual           
                                   translateX from -width                    
                                   to +width.                                

  Tier switch       Parent updates Gradient crossfade 300ms Re-render with   None --- controlled by
                    card.tier prop (LinearGradient          new tier config  parent
                                   transition)                               

  Network switch    Parent updates Instant re-render        Network logo     None --- controlled by
                    card.network                            changes          parent
                    prop                                                     
  ----------------- -------------- ------------------------ ---------------- -------------------------

**11.2 Shimmer Animation --- ShimmerOverlay.tsx**

+-----------------------------------------------------------------------+
| *TypeScript / React Native*                                           |
|                                                                       |
| > // components/ShimmerOverlay.tsx                                    |
| >                                                                     |
| > // Continuous shimmer sweep across the card face                    |
| >                                                                     |
| > import React, { useEffect, useRef } from \"react\";                 |
| >                                                                     |
| > import { Animated, StyleSheet } from \"react-native\";              |
| >                                                                     |
| > import LinearGradient from \"react-native-linear-gradient\";        |
| >                                                                     |
| > export const ShimmerOverlay: React.FC = () =\> {                    |
| >                                                                     |
| > const shimmerAnim = useRef(new Animated.Value(0)).current;          |
| >                                                                     |
| > useEffect(() =\> {                                                  |
| >                                                                     |
| > const loop = Animated.loop(                                         |
| >                                                                     |
| > Animated.timing(shimmerAnim, {                                      |
| >                                                                     |
| > toValue: 1,                                                         |
| >                                                                     |
| > duration: 4000,                                                     |
| >                                                                     |
| > useNativeDriver: true,                                              |
| >                                                                     |
| > })                                                                  |
| >                                                                     |
| > );                                                                  |
| >                                                                     |
| > loop.start();                                                       |
| >                                                                     |
| > return () =\> loop.stop();                                          |
| >                                                                     |
| > }, \[\]);                                                           |
| >                                                                     |
| > const translateX = shimmerAnim.interpolate({                        |
| >                                                                     |
| > inputRange: \[0, 1\],                                               |
| >                                                                     |
| > outputRange: \[-400, 400\], // Adjust to 2× card width              |
| >                                                                     |
| > });                                                                 |
| >                                                                     |
| > return (                                                            |
| >                                                                     |
| > \<Animated.View                                                     |
| >                                                                     |
| > pointerEvents=\"none\"                                              |
| >                                                                     |
| > style={\[StyleSheet.absoluteFillObject, { transform: \[{ translateX |
| > }\] }\]}                                                            |
| >                                                                     |
| > \>                                                                  |
| >                                                                     |
| > \<LinearGradient                                                    |
| >                                                                     |
| > colors={\[                                                          |
| >                                                                     |
| > \"rgba(255,255,255,0)\",                                            |
| >                                                                     |
| > \"rgba(255,255,255,0.50)\",                                         |
| >                                                                     |
| > \"rgba(255,255,255,0)\",                                            |
| >                                                                     |
| > \]}                                                                 |
| >                                                                     |
| > start={{ x: 0, y: 0 }}                                              |
| >                                                                     |
| > end={{ x: 1, y: 0 }}                                                |
| >                                                                     |
| > style={StyleSheet.absoluteFillObject}                               |
| >                                                                     |
| > /\>                                                                 |
| >                                                                     |
| > \</Animated.View\>                                                  |
| >                                                                     |
| > );                                                                  |
| >                                                                     |
| > };                                                                  |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **12** ─── **Data Model & API Contract**                              |
|                                                                       |
| *Card API endpoints · request/response shapes · mock data · secure    |
| reveal flow*                                                          |
|                                                                       |
| The coding agent must implement these API calls in a cardService.ts   |
| file.                                                                 |
+-----------------------------------------------------------------------+

**12.1 API Endpoints**

  ------------ ---------------------------------------- ----------- ----------------------------------
  **Method**   **Endpoint**                             **Auth**    **Description**

  GET          /v1/wallet/cards                         Bearer JWT  List all cards for the
                                                                    authenticated user. Returns
                                                                    CardData\[\] without sensitive
                                                                    fields.

  GET          /v1/wallet/cards/:cardId                 Bearer JWT  Get single card. Returns CardData
                                                                    without sensitive fields.

  POST         /v1/wallet/cards/:cardId/reveal          Bearer      Returns full card number and CVV.
                                                        JWT +       Encrypted. 30-second TTL on the
                                                        Biometric   returned token.
                                                        token       

  POST         /v1/wallet/cards/:cardId/freeze          Bearer JWT  Toggle freeze status. Returns
                                                                    updated card.status.

  POST         /v1/wallet/cards/:cardId/add-to-wallet   Bearer JWT  Initiate Apple Pay / Google Pay
                                                                    provisioning flow. Returns
                                                                    provisioning payload.

  GET          /v1/wallet/cards/:cardId/transactions    Bearer JWT  Paginated transaction list for
                                                                    this card. Returns tx\[\] with
                                                                    amount, merchant, date, category.

  PUT          /v1/wallet/cards/:cardId/limits          Bearer JWT  Update spending controls. Body:
                                                                    SpendControls.
  ------------ ---------------------------------------- ----------- ----------------------------------

**12.2 Mock Card Data**

+-----------------------------------------------------------------------+
| *TypeScript*                                                          |
|                                                                       |
| > // WalletCard.constants.ts --- MOCK_CARDS for development           |
| >                                                                     |
| > export const MOCK_CARDS: CardData\[\] = \[                          |
| >                                                                     |
| > {                                                                   |
| >                                                                     |
| > cardId: \"card-001-uuid\",                                          |
| >                                                                     |
| > merchantId: \"merchant-001-uuid\",                                  |
| >                                                                     |
| > network: \"visa\",                                                  |
| >                                                                     |
| > tier: \"standard\",                                                 |
| >                                                                     |
| > formFactor: \"virtual\",                                            |
| >                                                                     |
| > status: \"active\",                                                 |
| >                                                                     |
| > cardholderName: \"M. SELEPE\",                                      |
| >                                                                     |
| > lastFour: \"0582\",                                                 |
| >                                                                     |
| > maskedNumber: \"4716 •••• •••• 0582\",                              |
| >                                                                     |
| > expiryDisplay: \"09 / 29\",                                         |
| >                                                                     |
| > nfcEnabled: true,                                                   |
| >                                                                     |
| > dailyLimitCents: 1_000_000, // R10,000                              |
| >                                                                     |
| > issuedAt: \"2024-09-01T00:00:00Z\",                                 |
| >                                                                     |
| > expiresAt: \"2029-09-30T00:00:00Z\",                                |
| >                                                                     |
| > },                                                                  |
| >                                                                     |
| > {                                                                   |
| >                                                                     |
| > cardId: \"card-002-uuid\",                                          |
| >                                                                     |
| > merchantId: \"merchant-001-uuid\",                                  |
| >                                                                     |
| > network: \"mastercard\",                                            |
| >                                                                     |
| > tier: \"business\",                                                 |
| >                                                                     |
| > formFactor: \"physical\",                                           |
| >                                                                     |
| > status: \"active\",                                                 |
| >                                                                     |
| > cardholderName: \"M. SELEPE\",                                      |
| >                                                                     |
| > lastFour: \"1947\",                                                 |
| >                                                                     |
| > maskedNumber: \"5412 •••• •••• 1947\",                              |
| >                                                                     |
| > expiryDisplay: \"11 / 28\",                                         |
| >                                                                     |
| > nfcEnabled: true,                                                   |
| >                                                                     |
| > dailyLimitCents: 10_000_000, // R100,000                            |
| >                                                                     |
| > issuedAt: \"2024-11-01T00:00:00Z\",                                 |
| >                                                                     |
| > expiresAt: \"2028-11-30T00:00:00Z\",                                |
| >                                                                     |
| > },                                                                  |
| >                                                                     |
| > \];                                                                 |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **13** ─── **Compliance & Standards**                                 |
|                                                                       |
| *PCI DSS · ISO 7816 · ISO 14443 · NCR · SARB · POPIA --- what each    |
| requires on the card UI*                                              |
|                                                                       |
| Non-compliance is a card scheme violation. Every item in this section |
| is mandatory.                                                         |
+-----------------------------------------------------------------------+

**13.1 PCI DSS Requirements on Card UI**

+---+---------------------------------------------------------------------+
| * | **PCI DSS Level 1 --- Card Display Rules**                          |
| * |                                                                     |
| ! | Groway operates under PCI DSS Level 1 (the highest tier). These are |
| * | the card display rules that apply directly to the UI component.     |
| * | Violating any of these will fail a card scheme compliance audit.    |
+---+---------------------------------------------------------------------+

  ------------ --------------------- -------------------------------------
  **PCI DSS    **Requirement**       **Implementation in WalletCard**
  Rule**                             

  PCI DSS 3.4  Primary Account       maskedNumber always shows \"4716 ••••
               Number (PAN) must be  •••• 0582\". Full 16 digits NEVER
               masked when           stored in component state --- only
               displayed. Show       returned from secure API on explicit
               maximum first 6 +     reveal.
               last 4.               

  PCI DSS 3.4  CVV/CVC never stored. cvv prop is cleared from state after
               Never in              30 seconds. Never persisted. Only
               localStorage,         in-memory during reveal window.
               AsyncStorage, or      
               state longer than 30  
               seconds.              

  PCI DSS 6.4  Sensitive data        onRevealDetails must call secure API
               revealed only after   with biometric token. Implement using
               authentication.       Face ID / fingerprint before reveal.

  PCI DSS 8.3  30-second auto-hide   setTimeout 30_000 in useCardReveal
               for revealed card     hook. Cannot be overridden by
               data.                 merchant config.

  PCI DSS 3.3  Expiry date may be    expiryDisplay: \"09 / 29\" is always
               shown in full.        visible --- not a sensitive field.

  PCI DSS 4.2  Card data in transit  The /v1/wallet/cards/:id/reveal
               must be encrypted.    endpoint must use TLS 1.3. UI must
                                     not call this on HTTP.
  ------------ --------------------- -------------------------------------

**13.2 Required Compliance Text on Card Back**

  ---------------- --------------- -------------------------------------------
  **Text Element** **Required?**   **Exact Content**

  Issuer name      Mandatory       \"Groway Financial Services (Pty) Ltd\"

  ISO compliance   Mandatory       \"EMV chip compliant --- ISO/IEC 7816 &
                                   14443\"

  PCI DSS mark     Mandatory       \"PCI DSS L1\"

  NCR registration Mandatory       \"NCR Reg.\"

  SARB             Mandatory       \"SARB Auth.\"
  authorisation                    

  POPIA compliance Mandatory       \"POPIA Compliant\"

  Support contact  Required        \"support.groway.app · 0800 GROWAY\"

  Network          Mandatory       Visa or Mastercard logo on back (see §9)
  compliance                       --- card scheme requirement
  ---------------- --------------- -------------------------------------------

+-----------------------------------------------------------------------+
| **14** ─── **Accessibility**                                          |
|                                                                       |
| *WCAG 2.1 AA compliance for the WalletCard component*                 |
|                                                                       |
| Every user --- including those using screen readers or with low       |
| vision --- must be able to use the card component.                    |
+-----------------------------------------------------------------------+

**14.1 Accessibility Requirements**

  ----------------- --------------- ----------------------------------------
  **Requirement**   **WCAG          **Implementation**
                    Criterion**     

  Card number       1.1.1 Non-text  accessibilityLabel: \`Card ending in
  screen reader     content         \${card.lastFour}. Tap to reveal full
                                    number.\`

  Frozen card state 4.1.3 Status    accessibilityLabel includes \" --- Card
                    messages        is frozen\" when status is frozen

  Flip action       2.1.1 Keyboard  accessibilityRole=\"button\"
                    / 4.1.2 Name,   accessibilityLabel=\"Flip card to view
                    Role, Value     back\" on TouchableWithoutFeedback

  NFC symbol        1.1.1 Non-text  accessibilityLabel=\"NFC contactless
                    content         payments enabled\"
                                    accessibilityRole=\"image\"

  EMV chip          1.1.1 Non-text  accessibilityLabel=\"EMV chip\"
                    content         accessibilityRole=\"image\"

  Shimmer overlay   1.1.1 Non-text  importantForAccessibility=\"no\"
                    content         (Android) accessible={false} (iOS)

  Network logo      1.1.1 Non-text  accessibilityLabel=\"Visa card\" or
                    content         \"Mastercard card\"

  Tier badge        1.3.1 Info and  accessibilityLabel=\`\${card.tier} tier
                    relationships   \${card.formFactor} card\`

  Colour contrast   1.4.3 Contrast  Card text #0A3D30 on lightest gradient
                    (minimum)       bg (#FFFFFF): ratio 9.2:1 (passes AA and
                                    AAA)

  Touch target size 2.5.5 Target    Minimum 44×44pt touch target on all
                    size            interactive elements. Card itself is
                                    well above minimum.
  ----------------- --------------- ----------------------------------------

+-----------------------------------------------------------------------+
| **15** ─── **Testing Checklist**                                      |
|                                                                       |
| *Unit · visual regression · accessibility · performance ---           |
| definition of done*                                                   |
|                                                                       |
| The WalletCard component is not complete until every test below is    |
| passing.                                                              |
+-----------------------------------------------------------------------+

**15.1 Unit Tests --- WalletCard.test.tsx**

Use Jest and \@testing-library/react-native. Every test below must be
written and passing before the component is considered complete.

+---+----------------------------------------------------------------------+
|   | **Required unit tests**                                              |
|   |                                                                      |
|   | -   Renders without crashing with minimal props (cardId, network,    |
|   |     tier, status, maskedNumber, cardholderName, expiryDisplay,       |
|   |     nfcEnabled)                                                      |
|   |                                                                      |
|   | -   Shows masked number by default (\"4716 •••• •••• 0582\" ---      |
|   |     never shows full PAN without reveal)                             |
|   |                                                                      |
|   | -   Calls onRevealDetails when reveal is triggered --- assert it is  |
|   |     called exactly once                                              |
|   |                                                                      |
|   | -   Shows fullNumber after successful onRevealDetails resolution     |
|   |                                                                      |
|   | -   Auto-hides fullNumber after 30,000ms (use jest.useFakeTimers)    |
|   |                                                                      |
|   | -   Shows \"Frozen\" state correctly when card.status === \"frozen\" |
|   |                                                                      |
|   | -   Calls onFreeze(cardId) when Freeze button is pressed             |
|   |                                                                      |
|   | -   NFC symbol is visible when nfcEnabled === true                   |
|   |                                                                      |
|   | -   NFC symbol is NOT rendered when nfcEnabled === false             |
|   |                                                                      |
|   | -   Renders VISA logo correctly for network === \"visa\"             |
|   |                                                                      |
|   | -   Renders Mastercard circles for network === \"mastercard\"        |
|   |                                                                      |
|   | -   Applies correct tier gradient for each of the 4 tiers            |
|   |                                                                      |
|   | -   Displays correct badge text per tier (e.g. \"PREMIUM GOLD\" for  |
|   |     premium)                                                         |
|   |                                                                      |
|   | -   accessibilityLabel on card contains lastFour digits              |
|   |                                                                      |
|   | -   Double-tap guard: second tap during animation does not trigger   |
|   |     second flip                                                      |
+---+----------------------------------------------------------------------+

**15.2 Visual Regression Tests**

Use Storybook + Chromatic (or equivalent snapshot testing) for visual
regression. A snapshot must be captured for each of the following
states.

  --------------------- ------------------- ---------------------------------
  **Snapshot Name**     **Props to Set**    **What to Verify**

  standard-visa-front   tier: standard ·    Gradient, logo, chip, NFC, number
                        network: visa ·     masked, VISA logo, Standard badge
                        status: active      

  standard-mc-front     tier: standard ·    Mastercard circles visible and
                        network: mastercard correctly proportioned

  business-visa-front   tier: business ·    Business gradient is deeper green
                        network: visa       than standard

  premium-front         tier: premium ·     Deep forest green gradient at
                        network: visa       bottom-right

  virtual-front         tier: virtual ·     Lightest gradient variant
                        network: mastercard 

  card-back             Any tier --- after  Mag stripe, sig strip, CVV box,
                        flip                compliance text, NFC on back

  frozen-state          status: frozen      Freeze button shows \"Unfreeze\"
                                            · card may show visual frozen
                                            overlay

  revealed-number       isRevealed: true    Full 16-digit number visible ·
                                            CVV visible on back

  mini-card-wallet      size: mini          Mini chip, mini NFC, masked
                                            number, network logo scaled
                                            correctly
  --------------------- ------------------- ---------------------------------

**15.3 Performance Targets**

  ------------------ ------------- ---------------------------------------
  **Metric**         **Target**    **How to Measure**

  Card initial       \< 16ms (one  React DevTools Profiler --- mount time
  render             frame)        

  Flip animation     60fps (no     Flipper Performance plugin --- monitor
  frame rate         dropped       during spring animation
                     frames)       

  Shimmer animation  60fps         Flipper --- no frame drops after 5
                     continuous    minutes continuous loop

  Reveal API call +  \< 800ms      Network request + state update +
  render             total         re-render combined

  Tier gradient      \< 100ms      Time from prop change to gradient
  switch                           re-render

  Memory after 100   \< 50MB       Heapsnap before/after rendering 100
  card renders       increase      cards in a list
  ------------------ ------------- ---------------------------------------

+-----------------------------------------------------------------------+
| groway Wallet Card --- AI Coding Agent Specification                  |
|                                                                       |
| *EMV · NFC · Visa · Mastercard · React Native · PCI DSS L1 · March    |
| 2026 · Confidential*                                                  |
+-----------------------------------------------------------------------+
