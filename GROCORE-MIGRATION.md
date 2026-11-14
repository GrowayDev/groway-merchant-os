# GroCore — PostgreSQL Migration Guide

**Designed and Built by Motheto Selepe**

GroCore (formerly Tshepo) requires PostgreSQL for production. The append-only ledger guards (SQL triggers that block UPDATE/DELETE on ledger tables) only work on PostgreSQL — SQLite doesn't support constraint triggers.

## When to Migrate

| Environment | Database | Status |
|---|---|---|
| Sandbox dev | SQLite | ✅ Works (GroCore tests pass, no SQL guards) |
| Local dev (Mac) | PostgreSQL | ✅ Recommended (run SQL guards) |
| Production (Oracle/Netlify) | PostgreSQL | ✅ Required (SQL guards + multi-tenant scaling) |

## Migration Steps

### 1. Install PostgreSQL (on your Mac or server)

```bash
# Mac
brew install postgresql@16
brew services start postgresql@16

# Ubuntu/Oracle Cloud
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create the database

```bash
createdb groway
psql groway -c "CREATE ROLE groway_app LOGIN PASSWORD 'your-strong-password'; GRANT ALL ON DATABASE groway TO groway_app;"
```

### 3. Update your `.env`

```bash
# Change from SQLite to PostgreSQL:
DATABASE_URL="postgresql://groway_app:your-strong-password@localhost:5432/groway"
```

### 4. Switch the Prisma schema datasource

Edit `prisma/schema.prisma` line 5-8:

```prisma
datasource db {
  provider = "postgresql"    // was "sqlite"
  url      = env("DATABASE_URL")
}
```

### 5. Create the migration + push schema

```bash
# Generate the Prisma client for PostgreSQL
bunx prisma generate

# Create the initial migration (creates all 296 + 6 GroCore tables)
bunx prisma migrate dev --name baseline-grocore

# OR if you don't want migrations (just push the schema):
bunx prisma db push
```

### 6. Apply the GroCore ledger guards (CRITICAL — append-only enforcement)

```bash
psql groway -f prisma/grocore-ledger-guards.sql
```

This creates:
- `grocore_assert_entry_balanced()` — trigger that rejects any journal entry that doesn't sum to zero
- `grocore_block_mutation()` — trigger that blocks UPDATE/DELETE on `GroCoreJournalEntry`, `GroCoreLedgerLine`, and `GroCoreConsentEvent` (the ledger is append-only)

### 7. Migrate existing data from SQLite (if you have production data)

```bash
# Install pgloader
brew install pgloader    # Mac
# OR: sudo apt install pgloader    # Linux

# Migrate SQLite → PostgreSQL
pgloader sqlite:///path/to/dev.db postgresql://groway_app:password@localhost:5432/groway

# Verify row counts
psql groway -c "SELECT COUNT(*) FROM \"User\"; SELECT COUNT(*) FROM \"Merchant\";"
```

### 8. Seed demo data (if starting fresh)

```bash
bun run prisma/seed-demo.ts
```

### 9. Verify the ledger guards work

```bash
# This should SUCCEED (balanced entry):
psql groway -c "INSERT INTO \"GroCoreJournalEntry\" (id, \"tenantId\", \"idempotencyKey\", reason, \"correlationId\", currency, \"postedAt\") VALUES ('test1', 't1', 'k1', 'test', 'c1', 'ZAR', NOW()); INSERT INTO \"GroCoreLedgerLine\" (id, \"entryId\", \"accountId\", \"amountMinor\", currency) VALUES ('l1', 'test1', 'a1', 100, 'ZAR'), ('l2', 'test1', 'a2', -100, 'ZAR');"

# This should FAIL (unbalanced entry — the trigger blocks it):
psql groway -c "INSERT INTO \"GroCoreJournalEntry\" (id, \"tenantId\", \"idempotencyKey\", reason, \"correlationId\", currency, \"postedAt\") VALUES ('test2', 't1', 'k2', 'bad', 'c2', 'ZAR', NOW()); INSERT INTO \"GroCoreLedgerLine\" (id, \"entryId\", \"accountId\", \"amountMinor\", currency) VALUES ('l3', 'test2', 'a1', 100, 'ZAR'), ('l4', 'test2', 'a2', -99, 'ZAR');"

# This should FAIL (append-only — can't UPDATE a ledger entry):
psql groway -c "UPDATE \"GroCoreJournalEntry\" SET reason = 'tampered' WHERE id = 'test1';"
```

## GroCore Module Structure

```
src/lib/grocore/
├── ledger/
│   ├── ledger.ts                  # Double-entry ledger (idempotent, balanced, outbox)
│   └── prisma-ledger-repo.ts      # Prisma adapter (writes entry + outbox in one transaction)
├── consent/
│   └── consent.ts                 # Purpose-bound consent log (grant/revoke/expire)
├── decisioning/
│   └── orchestrator.ts            # Credit decision: consent → features → hard stops → affordability
├── gopay/
│   └── settlement.ts              # Sale settlement: capture → MDR fee → settle → repay → payout
├── repayment/
│   └── waterfall.ts              # Payment allocation across buckets + settlement split
├── edge/
│   └── envelope.ts                # Ed25519 signed decision envelopes for offline POS
└── shared/
    ├── money.ts                   # BigInt minor units (cents), never float
    └── ids.ts                     # UUIDv7 (sortable by creation time)
```

## GroCore Prisma Models

6 models appended to `prisma/schema.prisma`:

| Model | Purpose |
|---|---|
| `GroCoreAccount` | Chart of accounts (per tenant, unique code) |
| `GroCoreJournalEntry` | Journal entry header (idempotent, unique key per tenant) |
| `GroCoreLedgerLine` | Individual ledger lines (debit positive, credit negative, sums to zero) |
| `GroCoreOutbox` | Transactional outbox for event publishing |
| `GroCoreConsentEvent` | Append-only consent log (grant/revoke with expiry) |
| `GroCoreDecision` | Credit decision record (outcome, limit, reason codes, trace) |

## Wiring Into Groway (Next Steps)

The GroCore module is copied and tested. The remaining wiring (from `INTEGRATION.md`):

1. ✅ `src/lib/grocore/**` — copied + renamed + 24 tests pass
2. ✅ Prisma models appended to `schema.prisma`
3. ✅ SQL guards migration created (`prisma/grocore-ledger-guards.sql`)
4. ⬜ Call `settleSale` from GoPay settlement path (keep `goPayLive=false` until licensed)
5. ⬜ Wrap GroCredit tiers as `Policy` input to `DecisionOrchestrator`
6. ⬜ Wire `FeatureStore` to read from Merchant OS sales data
7. ⬜ Create API routes: `/api/merchant-os/grocore/ledger`, `/decision`, `/consent`, `/settle`
8. ⬜ Add GroCore dashboard view to Merchant OS sidebar
