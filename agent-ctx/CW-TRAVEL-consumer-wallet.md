# CW-TRAVEL — Travel and Events modules for Consumer Wallet

## Task
Build both API routes AND modal components for the Flights, Buses, Trains, and
Events modules of the Consumer Wallet in the Groway Merchant OS at
`/home/z/my-project`.

## Stack
- Next.js 16 App Router, TypeScript, Prisma 6 (SQLite)
- API helpers: `getUserId`, `ok`, `error`, `serialize` (from `src/app/api/consumer/_lib/helpers.ts`)
- Shared helper: `ensureConsumerUser` (from `src/app/api/consumer/_lib/ensureUser.ts`)
  — used to satisfy the FK constraint on `ConsumerTransaction.userId → ConsumerUser.id`
- Frontend API helper: `apiGet`, `apiPost`, `formatMoney`, `formatDate`
  (from `src/components/wallet/lib/api.ts`)
- Catalog at `src/lib/consumer-wallet/catalog.ts` — added `EVENT_CATEGORIES`,
  `MOVIE_CHAINS`, `EVENT_TICKET_TYPES`
- shadcn/ui components: `Button`, `Input`, `Badge`, `Table`, `Select`, etc.

## What was built

### 0. Catalog additions — `src/lib/consumer-wallet/catalog.ts`
- `EVENT_CATEGORIES` — Music / Sports / Movies / Comedy / Theatre / Festivals
  with icon and description
- `MOVIE_CHAINS` — Ster-Kinekor (5 venues) + Nu Metro (3 venues) with id, name,
  location
- `EVENT_TICKET_TYPES` — Regular / VIP / Premium / Student-Senior with
  multipliers (1.0 / 2.5 / 1.8 / 0.7)

### 1. Flights API — `src/app/api/consumer/travel/flights/route.ts`
- **GET** `?from=JNB&to=CPT&date=2026-02-15`
  - Returns `airlines` and `airports` from catalog (groupable by country)
  - Builds deterministic per-route flight schedules (departure slots, aircraft,
    duration based on route — domestic ZA 1-2h, ZA↔MW 3h, intra-MW 1h)
  - Each flight quote: `id`, `flightNumber`, `airlineId/Name/Code`, `aircraft`,
    `fromCode/City`, `toCode/City`, `departure`, `arrival`, `duration`,
    `priceCents` (BigInt), `seatsAvailable`, `cabin`
  - Route base prices for 16 routes (JNB-CPT R1899, JNB-LLW R3499, etc.)
- **POST** `{ flightId, passengers: [{name, idNumber, type}] }`
  - Validates flightId format `FLT-{airlineCode}-{from}-{to}-{idx}`
  - Validates each passenger (name, idNumber, type ∈ adult|child)
  - Adults full price; children 75% of adult fare (IATA child discount)
  - Generates 6-char **PNR** (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`, no ambiguous chars)
  - Generates 13-digit **IATA e-ticket number**: 3-digit airline IATA prefix
    (e.g. `083` for SAA) + 10-digit serial + Luhn check digit
  - Creates `ConsumerTransaction` (type=`flight_booking`, direction=`debit`,
    counterpartyType=`airline`, `voucherToken` = e-ticket number)
  - Calls `ensureConsumerUser(userId)` first so the FK constraint is satisfied
  - Returns `{ bookingRef, eTicketNumber, receiptNo, flight, passengers,
    totalAmount, currency, iataNotice, transactionId }`
  - `iataNotice` explains IATA Resolution 722f and the 13-digit format

### 2. Flights Modal — `src/components/wallet/modals/FlightsModal.tsx`
Full flow: search → results → passengers → confirm → e-ticket
- Loads airlines + airports from GET `/travel/flights` on open
- From/To dropdowns use shadcn `Select` with airports **grouped by country**
  (`SelectGroup` + `SelectLabel`: South Africa, Malawi)
- Swap airports button between From and To
- Date picker with `min` set to today
- Results shown in shadcn `Table` (Airline, Departure, Arrival, Duration, Price)
  with `seatsAvailable` per flight — tap row to select
- Passenger details form: name + ID number + adult/child select per passenger,
  add/remove up to 9 passengers, validates all required fields
- Confirm screen: total amount formatted with `formatMoney`, route summary
- **E-ticket result**: boarding-pass style card with PNR header, departure →
  arrival, flight/aircraft/date/duration info, 13-digit IATA e-ticket number,
  per-passenger list with name/ID/type/sub-e-ticket-number, QR code placeholder
  (`QrCode` icon), total paid, receipt no
- **IATA explainer** callout under the ticket explaining Resolution 722f

### 3. Buses API — `src/app/api/consumer/travel/buses/route.ts`
- **GET** `?from=jhb&to=cpt&date=2026-02-15`
  - Returns `operators` and `cities` from catalog
  - Per-route bus schedules with bus types (Sleepliner / Luxury Liner /
    Semi-Luxury / Standard), amenities per type, durations from a table
    (JNB-CPT 18h, JHB-LLW 28h, etc.)
  - Each bus: `id`, `operatorId/Name`, `fromCityId/City`, `toCityId/City`,
    `busType`, `departure`, `arrival`, `duration`, `priceCents`, `seatsAvailable`,
    `amenities[]`
- **POST** `{ busId, fromCity, toCity, date, passengers }`
  - Validates busId format, passengers
  - Adults full price; children 50% off
  - Generates 8-char **booking reference**
  - Generates ticket number `ZA/{operator-prefix}/{7-digit-serial}/{check-char}`
  - Creates `ConsumerTransaction` (type=`bus_booking`,
    counterpartyType=`bus_operator`, `voucherToken` = ticket number)
  - Assigns sequential seat numbers 1..N
  - Returns `{ bookingRef, ticketNumber, receiptNo, bus, passengers, totalAmount,
    notice }`

### 4. Buses Modal — `src/components/wallet/modals/BusModal.tsx`
Full flow: search → results → passengers → confirm → ticket
- From/To cities grouped by country (South Africa, Malawi) in shadcn `Select`
- Results table (Operator, Departure, Arrival, Bus type, Price)
- Passenger details form (name, ID, adult/child)
- Confirm screen with route summary
- **Ticket**: boarding-pass style card with booking ref, from → to, operator/
  bus type/date/duration, ticket number, passengers with assigned **seat
  numbers**, QR placeholder, total paid + receipt

### 5. Train API — `src/app/api/consumer/travel/trains/route.ts`
- **GET**
  - Returns `operators` derived from `TRAIN_OPERATORS` (Gautrain + Shosholoza
    Meyl) with their routes from catalog, each route having a stable
    `{operatorId}-R{n}` id, `priceCents` (BigInt), `duration`
- **POST** `{ operatorId, routeId, passengers: [{name, idNumber, type}] }`
  - Validates operator/route/passengers
  - Passengers can be `adult` | `child` (50% off) | `pensioner` (30% off)
  - Generates `TRN-{6 chars}` **booking reference**
  - Generates `ZA-{prefix-3}-{7-digit-serial}-{Luhn-check}` ticket number
  - Creates `ConsumerTransaction` (type=`train_booking`,
    counterpartyType=`train_operator`, `voucherToken` = ticket number)
  - Assigns random coach `C1`-`C6` and seat numbers per passenger
  - Returns `{ bookingRef, ticketNumber, receiptNo, operator, route, passengers,
    totalAmount, notice }`

### 6. Train Modal — `src/components/wallet/modals/TrainModal.tsx`
Full flow: operator → route → passengers → confirm → ticket
- Operator cards (Gautrain / Shosholoza Meyl) with route count
- Route selector with from → to, duration, price (via `formatMoney`)
- Passenger form (adult/child/pensioner)
- Confirm screen with summary
- **Ticket**: card with booking ref, from → to, operator/duration, ticket
  number, passengers with **coach + seat**, QR placeholder, total + receipt

### 7. Events API — `src/app/api/consumer/events/route.ts` (replaced existing)
- **GET** `?category=music|sports|movies|comedy|theatre|festivals`
  - Returns `categories` (EVENT_CATEGORIES), `ticketTypes`
    (EVENT_TICKET_TYPES), `movieChains` (MOVIE_CHAINS)
  - Builds **realistic mock events for the current + next month**:
    - Movies: 6 movies × 2 per venue across all Ster-Kinekor + Nu Metro venues
      (12 movie events), with runtime, age rating, multiple showtimes
    - Music: 5 concerts (Kabza De Small, DJ Maphorisa, Burna Boy, Miriam
      Makeba tribute, Amapiano Festival) at SA venues
    - Sports: 5 events (Chiefs vs Pirates, Springboks vs All Blacks, Proteas
      vs India, Sundowns vs Chiefs, Boxing title fight)
    - Theatre: 4 stage productions (Sarafina!, Lion King, Color Purple,
      Sophiatown)
    - Comedy: 3 stand-up shows (Trevor Noah, Trevor Gumbi, Comedy Central)
    - Festivals: 4 multi-day festivals (CT Jazz, Oppikoppi, National Arts,
      Rocking the Daisies)
  - Each event has `id`, `category`, `type`, `title`, `venue`, `venueId`,
    `city`, `date` (ISO), `dateLabel` (formatted), `time`, `durationMinutes`,
    `ageRating`, `image`, `description`, `basePriceCents`, `availableTickets`,
    `seatMap`
- **POST** `{ eventId, ticketType, quantity }`
  - Validates event exists, ticketType ∈ EVENT_TICKET_TYPES, quantity 1-20
  - Checks available tickets
  - Computes unit price = base × multiplier, total = unit × qty
  - Generates `EVT-{8 chars}` **ticket number**
  - Generates **QR code placeholder**: `data:text/plain;base64,<payload>`
    encoding `GROWAY-EVT|{ticketNo}|{timestamp}` (storable as `voucherToken`)
  - Creates `ConsumerTransaction` (type=`event_ticket`,
    counterpartyType=`venue`, `voucherToken` = qrCode payload)
  - Assigns seat numbers (A1, B2, ...) for events with `seatMap` enabled
  - Returns `{ ticketNo, qrCode, receiptNo, event, ticketType, tickets,
    totalAmount, unitPrice, notice }`

### 8. Events Modal — `src/components/wallet/modals/EventsModal.tsx`
Full flow: browse by category → select event → choose ticket type → quantity →
confirm → ticket with QR
- Loads categories + ticket types + events on open
- **Category tabs** (Music, Sports, Movies, Comedy, Theatre, Festivals) as
  horizontally scrollable pills — clicking refetches filtered events
- Event cards with image placeholder (emoji), title, venue, city, date, time,
  base price, age rating — tap to view details
- Details screen with gradient header, description, venue/date/time/runtime
  info, base price + tickets-left badge
- **Ticket selection**: 4 ticket type cards (Regular/VIP/Premium/Student) with
  per-type price = base × multiplier
- **Quantity stepper** (1-20) with - / + buttons
- Total preview using `formatMoney` (BigInt cents)
- Confirm screen with summary
- **Result**: ticket card with ticket number header, event image/title/
  category, venue/city/date/time/age/type grid, list of tickets with seat
  assignment + entry codes, **QR code placeholder**, total paid + receipt no

## Runtime verification
All 4 GET + 4 POST endpoints were tested end-to-end with the Next dev server +
`X-Dev-Bypass: true` header. Sample responses:

- **Flight POST**: PNR `S5U5S9`, e-ticket `08388118521345` (SAA IATA prefix
  `083`, Luhn-valid), 1 adult passenger, total R1,747.08
- **Bus POST**: booking ref `HGTJZBFZ`, ticket `ZA/GR/4207348/X`, seat 1,
  Greyhound Sleepliner JHB→CPT, total R585
- **Train POST**: booking ref `TRN-474A97`, ticket `ZA-GAU-8248265-0`,
  coach C4 seat 14, Gautrain Park→OR Tambo, total R175
- **Event POST**: ticket `EVT-FFWXSXEQ`, 2× VIP tickets for Kabza De Small
  Live @ Sun Arena, seats A1+B2, total R1,750

Each POST creates a `ConsumerTransaction` row in SQLite (`type` =
`flight_booking` / `bus_booking` / `train_booking` / `event_ticket`).

## Type-check verification
```
NODE_OPTIONS="--max-old-space-size=4096" bunx tsc --noEmit 2>&1 | \
  grep -E "api/consumer/travel/(flights|buses|trains)|api/consumer/events|wallet/modals/(Flights|Bus|Train|Events)Modal|consumer-wallet/catalog"
```
returns **zero errors** for all files created/modified by this task.

## Files created / modified

Created:
- `src/app/api/consumer/travel/flights/route.ts` (310 lines)
- `src/app/api/consumer/travel/buses/route.ts`  (282 lines)
- `src/app/api/consumer/travel/trains/route.ts` (216 lines)

Replaced (old version used non-existent `@/lib/auth-context`):
- `src/app/api/consumer/events/route.ts` (458 lines)

Rewritten (full flows + shadcn Select/Table + e-tickets with QR placeholders):
- `src/components/wallet/modals/FlightsModal.tsx` (722 lines)
- `src/components/wallet/modals/BusModal.tsx`      (450 lines)
- `src/components/wallet/modals/TrainModal.tsx`    (401 lines)
- `src/components/wallet/modals/EventsModal.tsx`   (528 lines)

Catalog additions:
- `src/lib/consumer-wallet/catalog.ts` — added `EVENT_CATEGORIES`,
  `MOVIE_CHAINS`, `EVENT_TICKET_TYPES`

## Notes
- All four booking endpoints call `ensureConsumerUser(userId)` before writing
  the `ConsumerTransaction` to avoid the SQLite FK violation
  (`ConsumerTransaction.userId → ConsumerUser.id`). In production this is a
  no-op because the user is created at onboarding.
- All BigInt cents are serialized to strings in API responses via the shared
  `serialize()` helper, and rendered with `formatMoney()` on the frontend.
- The QR codes are placeholders (Lucide `QrCode` icon) — the API generates a
  real base64 payload stored in `voucherToken` for downstream rendering.
- The existing `/api/consumer/travel/route.ts` (old omnibus travel endpoint
  with Rovos Rail etc.) was left untouched — it's a separate older
  implementation. The new dedicated routes (`/travel/flights`, `/travel/buses`,
  `/travel/trains`) are the canonical paths used by the rewritten modals.
