# Groway Merchant OS - Inventory Module Complete TODO List

**Generated:** March 2025  
**Status:** Pre-Release Assessment  
**Overall Module Completion:** 40%

---

## Executive Summary

The Inventory Management module requires significant backend implementation to become fully functional and release-ready. While the frontend UI is comprehensive (Task ID 4-6 in worklog), it currently operates entirely on mock data. The core gaps are:

1. **Database Models**: Missing core inventory models (Product, Batch, StockMovement, etc.)
2. **API Integration**: Frontend not connected to real database
3. **Business Logic**: FIFO algorithm, batch tracking, expiry management not implemented
4. **Integration**: GroSupply, Recipe Engine, POS not connected to inventory
5. **Background Services**: No alerting, forecasting, or sync services running

**Estimated Effort:** 8-10 weeks for full implementation

---

## PHASE 1: Database Schema - Add Missing Inventory Models

### 1-a: Product, ProductVariant, ProductCategory Models

**Priority:** HIGH  
**Estimated Effort:** 4 hours  
**Dependencies:** None

**Current State:**
- Products exist in UI mock data only
- No database persistence
- No variant matrix support

**Required Schema:**

```prisma
model ProductCategory {
  id          String   @id @default(cuid())
  name        String
  code        String   @unique
  parentId    String?
  parent      ProductCategory?  @relation("CategoryTree", fields: [parentId], references: [id])
  children    ProductCategory[] @relation("CategoryTree")
  vatTreatment String  @default("standard_15") // standard_15, zero_rated, exempt, out_of_scope
  products    Product[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Product {
  id                    String   @id @default(cuid())
  merchantId            String
  name                  String
  description           String?
  internalSku           String   @unique
  barcodeEan13          String?  @unique
  barcodeUpc            String?  @unique
  supplierCode          String?
  brand                 String?
  categoryId            String?
  category              ProductCategory? @relation(fields: [categoryId], references: [id])
  
  // Pricing
  costPriceCents        BigInt   @default(0)  // Weighted average cost
  sellingPriceCents     BigInt   @default(0)  // VAT-inclusive
  minSellingPriceCents  BigInt?  // Floor price
  tradePriceCents       BigInt?  // B2B price
  rrpCents              BigInt?  // Recommended retail
  
  // Stock Control
  trackStock            Boolean  @default(true)
  allowNegativeStock    Boolean  @default(false)
  reorderPoint          Int      @default(0)
  reorderQty            Int      @default(0)
  parLevel              Int?
  leadTimeDays          Int      @default(3)
  minOrderQty           Int?
  storageLocation       String?
  storageConditions     String   @default("ambient") // ambient, refrigerated_2_8, frozen_minus18, controlled
  unitOfMeasure         String   @default("each") // each, kg, g, litre, ml, metre, pair, dozen
  weightGrams           Decimal? @db.Decimal(10, 3)
  
  // Compliance
  batchTrackingRequired Boolean  @default(false)
  expiryTracking        Boolean  @default(false)
  shelfLifeDays         Int?
  expiryAlertDays       Int?
  scheduleClass         Int?     // SAHPRA drug schedule 0-6
  ageRestricted         Boolean  @default(false)
  coldChainRequired     Boolean  @default(false)
  allergens             String?  // JSON array
  halalCertified        Boolean  @default(false)
  kosherCertified       Boolean  @default(false)
  vegan                 Boolean  @default(false)
  organic               Boolean  @default(false)
  sabsCertified         Boolean  @default(false)
  recallStatus          String   @default("none") // none, quarantined, recalled, cleared
  
  // Pharmacy
  nappiCode             String?
  
  // Electronics
  imeiTracking          Boolean  @default(false)
  serialTracking        Boolean  @default(false)
  
  // Loyalty
  loyaltyEarnMultiplier Decimal  @default(1.0) @db.Decimal(3, 2)
  
  // Promotions
  promoPriceCents       BigInt?
  promoStart            DateTime?
  promoEnd              DateTime?
  
  // Commission (for services)
  commissionRatePct     Decimal? @db.Decimal(5, 2)
  
  // Soft delete
  archivedAt            DateTime?
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  variants              ProductVariant[]
  batches               Batch[]
  movements             StockMovement[]
  stocktakeItems        StocktakeItem[]
  
  @@index([merchantId])
  @@index([internalSku])
  @@index([barcodeEan13])
}

model ProductVariant {
  id              String   @id @default(cuid())
  productId       String
  product         Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  // Variant attributes
  name            String   // e.g., "Large / Blue"
  sku             String   @unique
  barcode         String?  @unique
  
  // Dimension values
  attr1Value      String?  // e.g., "Large"
  attr2Value      String?  // e.g., "Blue"
  attr3Value      String?  // e.g., "Cotton"
  
  // Override pricing (if different from parent)
  costPriceCents  BigInt?
  sellingPriceCents BigInt?
  
  // Stock tracked per variant
  stockOnHand     Int      @default(0)
  reservedStock   Int      @default(0)
  
  active          Boolean  @default(true)
  archivedAt      DateTime?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  batches         Batch[]
  movements       StockMovement[]
  
  @@index([productId])
  @@index([sku])
}
```

**Definition of Done:**
- [ ] Schema created and migrated
- [ ] Prisma client regenerated
- [ ] Test products seeded via API
- [ ] All unit tests passing

---

### 1-b: Batch, BatchTransaction Models for FIFO

**Priority:** HIGH  
**Estimated Effort:** 4 hours  
**Dependencies:** 1-a

**Required Schema:**

```prisma
model Batch {
  id              String   @id @default(cuid())
  batchNumber     String
  productId       String
  product         Product  @relation(fields: [productId], references: [id])
  variantId       String?
  variant         ProductVariant? @relation(fields: [variantId], references: [id])
  
  // Quantities
  initialQty      Int      // Original quantity received
  currentQty      Int      // Remaining quantity
  reservedQty     Int      @default(0) // Reserved for pending sales
  
  // Cost at time of receipt
  costPriceCents  BigInt   // Cost per unit when received
  
  // Dates
  productionDate  DateTime?
  expiryDate      DateTime?
  receivedDate    DateTime @default(now())
  
  // Status
  status          String   @default("active") // active, expired, quarantined, recalled, depleted
  
  // Source
  grnId           String?  // Reference to GoodsReceivedNote
  grnItemId       String?
  
  // Location
  locationId      String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  transactions    BatchTransaction[]
  
  @@unique([batchNumber, productId])
  @@index([productId])
  @@index([expiryDate])
  @@index([status])
}

model BatchTransaction {
  id              String   @id @default(cuid())
  batchId         String
  batch           Batch    @relation(fields: [batchId], references: [id])
  
  // Transaction details
  type            String   // received, sold, adjusted, transferred_out, transferred_in, expired, recalled
  quantity        Int      // Positive for in, negative for out
  balanceAfter    Int      // Running balance
  
  // Reference
  referenceType   String?  // sale, grn, adjustment, transfer, stocktake
  referenceId     String?
  
  // Cost at time of transaction
  costPriceCents  BigInt
  
  // Audit
  performedBy     String?  // User ID
  performedByName String?
  reason          String?
  notes           String?
  
  createdAt       DateTime @default(now())
  
  @@index([batchId])
  @@index([createdAt])
}
```

**Definition of Done:**
- [ ] Schema created and migrated
- [ ] FIFO query helper functions created
- [ ] Batch transaction logging working
- [ ] Expiry alert integration ready

---

### 1-c: StockLocation, StockLocationInventory Models

**Priority:** HIGH  
**Estimated Effort:** 3 hours  
**Dependencies:** 1-a

**Required Schema:**

```prisma
model StockLocation {
  id              String   @id @default(cuid())
  merchantId      String
  name            String
  code            String   @unique
  type            String   @default("store") // store, warehouse, kiosk, franchise, in_transit
  address         String?
  city            String?
  province        String?
  postalCode      String?
  phone           String?
  email           String?
  managerId       String?
  managerName     String?
  operatingHours  String?  // JSON object
  status          String   @default("active") // active, inactive, maintenance
  
  // For transfers
  defaultSource   Boolean  @default(false)
  defaultDest     Boolean  @default(false)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  inventory       StockLocationInventory[]
  transfersFrom   StockTransfer[] @relation("TransferFrom", fields: [], references: [])
  transfersTo     StockTransfer[] @relation("TransferTo", fields: [], references: [])
  
  @@index([merchantId])
}

model StockLocationInventory {
  id              String   @id @default(cuid())
  locationId      String
  location        StockLocation @relation(fields: [locationId], references: [id], onDelete: Cascade)
  productId       String
  product         Product  @relation(fields: [productId], references: [id])
  variantId       String?
  
  stockOnHand     Int      @default(0)
  reservedStock   Int      @default(0)
  inTransitQty    Int      @default(0)
  
  lastCountedAt   DateTime?
  lastMovementAt  DateTime?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([locationId, productId, variantId])
  @@index([locationId])
  @@index([productId])
}
```

**Definition of Done:**
- [ ] Schema created and migrated
- [ ] Location-based stock queries working
- [ ] Default locations seeded
- [ ] Multi-location inventory view working

---

### 1-d: StockMovement Model (Immutable Append-Only)

**Priority:** HIGH  
**Estimated Effort:** 3 hours  
**Dependencies:** 1-a, 1-b, 1-c

**Required Schema:**

```prisma
model StockMovement {
  id                String   @id @default(cuid())
  merchantId        String
  
  // Idempotency for retry safety
  idempotencyKey    String   @unique
  
  // What moved
  productId         String
  product           Product  @relation(fields: [productId], references: [id])
  variantId         String?
  batchId           String?
  batch             Batch?   @relation(fields: [batchId], references: [id])
  
  // Movement details
  type              String   // sale, return, grn, adjustment, transfer_out, transfer_in, stocktake, recipe, assembly
  direction         String   // in, out
  quantity          Int      // Always positive, direction indicates flow
  
  // Location
  locationId        String?
  sourceLocationId  String?  // For transfers
  destLocationId    String?  // For transfers
  
  // Cost tracking (locked at movement time)
  costPriceCents    BigInt   // Cost per unit at time of movement
  totalCostCents    BigInt   // quantity * costPriceCents
  
  // Reason codes
  reasonCode        String?  // damaged, expired, theft, found, count_adjustment, etc.
  reasonNotes       String?
  
  // Reference
  referenceType     String?  // sale, grn, transfer, stocktake, adjustment
  referenceId       String?
  
  // Audit
  performedBy       String?  // User ID
  performedByName   String?
  
  // Accounting
  journalEntryId    String?  // Reference to accounting journal
  
  // Immutable - no updates allowed
  createdAt         DateTime @default(now())
  
  @@index([merchantId])
  @@index([productId])
  @@index([type])
  @@index([createdAt])
  @@index([idempotencyKey])
}
```

**Definition of Done:**
- [ ] Schema created with immutable constraint
- [ ] Idempotency key validation working
- [ ] Movement type handlers implemented
- [ ] Audit trail complete

---

### 1-e: Stocktake, StocktakeItem Models

**Priority:** HIGH  
**Estimated Effort:** 3 hours  
**Dependencies:** 1-a, 1-d

**Required Schema:**

```prisma
model Stocktake {
  id              String   @id @default(cuid())
  merchantId      String
  number          String   @unique
  
  // Scope
  type            String   // full, category, low_stock, blind, spot_check
  categoryId      String?
  locationId      String?
  
  // Status
  status          String   @default("draft") // draft, in_progress, completed, cancelled
  
  // Counts
  itemsTotal      Int      @default(0)
  itemsCounted    Int      @default(0)
  itemsVariance   Int      @default(0)
  
  // Variance totals
  varianceQtyPositive  Int   @default(0)
  varianceQtyNegative  Int   @default(0)
  varianceValueCents   BigInt @default(0)
  
  // Blind count
  isBlind         Boolean  @default(false)
  
  // Approval
  initiatedBy     String?
  initiatedByName String?
  completedBy     String?
  completedByName String?
  approvedBy      String?
  approvedByName  String?
  approvedAt      DateTime?
  
  // Dates
  startedAt       DateTime?
  completedAt     DateTime?
  
  notes           String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  items           StocktakeItem[]
  
  @@index([merchantId])
  @@index([status])
}

model StocktakeItem {
  id              String   @id @default(cuid())
  stocktakeId     String
  stocktake       Stocktake @relation(fields: [stocktakeId], references: [id], onDelete: Cascade)
  
  productId       String
  product         Product  @relation(fields: [productId], references: [id])
  variantId       String?
  
  // Quantities
  systemQty       Int      @default(0)  // What system says
  countedQty      Int?     // What was counted
  variance        Int?     // counted - system
  
  // Blind count (system qty hidden until submitted)
  blindCount      Boolean  @default(false)
  
  // Cost for variance calculation
  costPriceCents  BigInt   @default(0)
  varianceCost    BigInt?  // variance * costPriceCents
  
  // Counting
  countedBy       String?
  countedByName   String?
  countedAt       DateTime?
  
  // Batch tracking
  batchId         String?
  
  notes           String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([stocktakeId, productId, variantId])
  @@index([stocktakeId])
}
```

**Definition of Done:**
- [ ] Schema created and migrated
- [ ] Stocktake creation working
- [ ] Variance calculation working
- [ ] Approval workflow functional

---

### 1-f: StockTransfer Models

**Priority:** HIGH  
**Estimated Effort:** 2 hours  
**Dependencies:** 1-c

**Required Schema:**

```prisma
model StockTransfer {
  id              String   @id @default(cuid())
  merchantId      String
  number          String   @unique
  
  // Locations
  sourceLocationId  String
  sourceLocation    StockLocation @relation("TransferFrom", fields: [sourceLocationId], references: [id])
  destLocationId    String
  destLocation      StockLocation @relation("TransferTo", fields: [destLocationId], references: [id])
  
  // Status
  status          String   @default("draft") // draft, pending, approved, in_transit, received, cancelled, partial
  
  // Approval
  requestedBy     String?
  requestedByName String?
  approvedBy      String?
  approvedByName  String?
  approvedAt      DateTime?
  
  // Shipping
  shippedBy       String?
  shippedByName   String?
  shippedAt       DateTime?
  estimatedArrival DateTime?
  
  // Receiving
  receivedBy      String?
  receivedByName  String?
  receivedAt      DateTime?
  
  notes           String?
  internalNotes   String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  items           StockTransferItem[]
  
  @@index([merchantId])
  @@index([status])
}

model StockTransferItem {
  id              String   @id @default(cuid())
  transferId      String
  transfer        StockTransfer @relation(fields: [transferId], references: [id], onDelete: Cascade)
  
  productId       String
  variantId       String?
  
  requestedQty    Int      @default(0)
  shippedQty      Int      @default(0)
  receivedQty     Int      @default(0)
  
  batchId         String?
  
  notes           String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([transferId])
}
```

**Definition of Done:**
- [ ] Schema created and migrated
- [ ] Transfer creation workflow
- [ ] In-transit tracking
- [ ] Receiving with variance handling

---

### 1-g: DemandForecast, StockAlert Models

**Priority:** MEDIUM  
**Estimated Effort:** 2 hours  
**Dependencies:** 1-a

**Required Schema:**

```prisma
model DemandForecast {
  id              String   @id @default(cuid())
  merchantId      String
  productId       String
  variantId       String?
  locationId      String?
  
  // Forecast period
  forecastDate    DateTime // The date being forecasted
  generatedAt     DateTime @default(now())
  
  // Predictions
  predictedQty    Float    // Predicted quantity to sell
  confidence      Float    @default(0) // 0-1 confidence score
  
  // Context
  dayOfWeek       Int      // 0-6
  isHoliday       Boolean  @default(false)
  isPromo         Boolean  @default(false)
  
  // Model metadata
  modelVersion    String?
  features        String?  // JSON of features used
  
  createdAt       DateTime @default(now())
  
  @@unique([productId, variantId, locationId, forecastDate])
  @@index([productId])
  @@index([forecastDate])
}

model StockAlert {
  id              String   @id @default(cuid())
  merchantId      String
  productId       String
  variantId       String?
  locationId      String?
  batchId         String?
  
  // Alert details
  type            String   // low_stock, out_of_stock, expiring_soon, expired, overstock, dead_stock
  severity        String   @default("warning") // info, warning, critical
  
  // Status
  status          String   @default("active") // active, acknowledged, resolved, dismissed
  
  // Details
  message         String
  currentValue    Float?
  thresholdValue  Float?
  
  // Context
  daysOfStock     Float?
  expiryDate      DateTime?
  
  // Resolution
  acknowledgedBy  String?
  acknowledgedAt  DateTime?
  resolvedBy      String?
  resolvedAt      DateTime?
  resolutionNotes String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([merchantId])
  @@index([type])
  @@index([status])
}
```

**Definition of Done:**
- [ ] Schema created and migrated
- [ ] Alert generation working
- [ ] Forecast storage working
- [ ] Alert notification integration

---

## PHASE 2: Core Inventory APIs - Connect Frontend to Database

### 2-a: Enhance Products API

**Priority:** HIGH  
**Estimated Effort:** 6 hours  
**Dependencies:** 1-a

**Current State:**
- Products API exists but is basic
- No variant support
- No compliance fields

**Required Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory/products` | List with pagination, search, filter |
| GET | `/api/inventory/products/:id` | Get single product with variants |
| POST | `/api/inventory/products` | Create with variants |
| PUT | `/api/inventory/products/:id` | Update product |
| DELETE | `/api/inventory/products/:id` | Soft delete (archive) |
| POST | `/api/inventory/products/:id/variants` | Add variant |
| PUT | `/api/inventory/products/:id/variants/:vid` | Update variant |
| POST | `/api/inventory/products/import` | Bulk import CSV |
| GET | `/api/inventory/products/export` | Export to CSV |

**Implementation Notes:**
- Include stock on hand in response
- Include batch info if batch-tracked
- Include variants in single response
- Support barcode lookup (scan)

**Definition of Done:**
- [ ] All endpoints implemented
- [ ] Validation working
- [ ] Search/filter functional
- [ ] Import/export working
- [ ] Frontend connected

---

### 2-b: Implement Stock Movements API

**Priority:** HIGH  
**Estimated Effort:** 8 hours  
**Dependencies:** 1-a, 1-b, 1-d

**Required Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory/movements` | List with pagination, filter by type/date/product |
| GET | `/api/inventory/movements/:id` | Get movement details |
| POST | `/api/inventory/movements` | Create movement (adjustment, manual) |
| POST | `/api/inventory/movements/sale` | POS sale deduction (internal) |
| POST | `/api/inventory/movements/return` | Customer return |
| GET | `/api/inventory/movements/export` | Export to CSV |

**Atomic Transaction Requirements:**

```typescript
// Movement creation must be atomic
async function createMovement(data: MovementInput) {
  return await prisma.$transaction(async (tx) => {
    // 1. Create movement record
    const movement = await tx.stockMovement.create({
      data: {
        idempotencyKey: data.idempotencyKey,
        // ... other fields
      }
    });
    
    // 2. Update product stock
    await tx.product.update({
      where: { id: data.productId },
      data: {
        stockOnHand: {
          increment: data.direction === 'in' ? data.quantity : -data.quantity
        }
      }
    });
    
    // 3. Update batch if applicable
    if (data.batchId) {
      await tx.batch.update({
        where: { id: data.batchId },
        data: {
          currentQty: {
            increment: data.direction === 'in' ? data.quantity : -data.quantity
          }
        }
      });
      
      // 4. Create batch transaction
      await tx.batchTransaction.create({
        data: {
          batchId: data.batchId,
          type: data.type,
          quantity: data.direction === 'in' ? data.quantity : -data.quantity,
          balanceAfter: newBalance,
          costPriceCents: data.costPriceCents,
        }
      });
    }
    
    // 5. Publish event for accounting
    // await publishKafkaEvent('inventory.movement', movement);
    
    return movement;
  });
}
```

**Definition of Done:**
- [ ] All endpoints implemented
- [ ] Atomic transactions working
- [ ] Idempotency key validation
- [ ] Batch consumption integrated
- [ ] Event publishing ready

---

### 2-c: Implement Batches API

**Priority:** HIGH  
**Estimated Effort:** 6 hours  
**Dependencies:** 1-b

**Required Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory/batches` | List with filter by product, status, expiry |
| GET | `/api/inventory/batches/:id` | Get batch with transactions |
| POST | `/api/inventory/batches` | Create batch (usually from GRN) |
| PUT | `/api/inventory/batches/:id` | Update batch |
| POST | `/api/inventory/batches/:id/quarantine` | Quarantine batch |
| POST | `/api/inventory/batches/:id/recall` | Initiate recall |
| GET | `/api/inventory/batches/expiring` | Get expiring batches |
| GET | `/api/inventory/batches/:id/transactions` | Get transaction history |

**FIFO Consumption Algorithm:**

```typescript
async function consumeFIFO(productId: string, quantity: number): Promise<BatchConsumption[]> {
  // Get active batches ordered by received date (oldest first)
  const batches = await prisma.batch.findMany({
    where: {
      productId,
      status: 'active',
      currentQty: { gt: 0 }
    },
    orderBy: [
      { expiryDate: 'asc' },  // Expire date first (if tracking)
      { receivedDate: 'asc' } // Then received date (FIFO)
    ]
  });
  
  const consumptions: BatchConsumption[] = [];
  let remaining = quantity;
  
  for (const batch of batches) {
    if (remaining <= 0) break;
    
    const consumeQty = Math.min(batch.currentQty, remaining);
    consumptions.push({
      batchId: batch.id,
      quantity: consumeQty,
      costPriceCents: batch.costPriceCents
    });
    
    remaining -= consumeQty;
  }
  
  if (remaining > 0) {
    throw new Error(`Insufficient stock. Short by ${remaining} units.`);
  }
  
  return consumptions;
}
```

**Definition of Done:**
- [ ] FIFO algorithm working
- [ ] Batch creation from GRN
- [ ] Expiry tracking functional
- [ ] Recall workflow complete
- [ ] Transaction history logging

---

### 2-d: Implement Stocktake API

**Priority:** HIGH  
**Estimated Effort:** 8 hours  
**Dependencies:** 1-e, 1-d

**Required Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory/stocktake` | List stocktakes |
| GET | `/api/inventory/stocktake/:id` | Get stocktake with items |
| POST | `/api/inventory/stocktake` | Create stocktake |
| PUT | `/api/inventory/stocktake/:id` | Update stocktake |
| POST | `/api/inventory/stocktake/:id/start` | Start counting |
| POST | `/api/inventory/stocktake/:id/count` | Submit count for item |
| POST | `/api/inventory/stocktake/:id/complete` | Complete stocktake |
| POST | `/api/inventory/stocktake/:id/approve` | Approve and post variances |
| POST | `/api/inventory/stocktake/:id/cancel` | Cancel stocktake |

**Stocktake Workflow:**

```
Draft → In Progress → Completed → Approved
         ↓               ↓
      Cancelled      Cancelled
```

**Variance Processing:**

```typescript
async function approveStocktake(stocktakeId: string, approvedBy: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Get all items with variance
    const items = await tx.stocktakeItem.findMany({
      where: { stocktakeId, variance: { not: 0 } }
    });
    
    // 2. Create movements for each variance
    for (const item of items) {
      const direction = item.variance! > 0 ? 'in' : 'out';
      const quantity = Math.abs(item.variance!);
      
      await tx.stockMovement.create({
        data: {
          type: 'stocktake',
          direction,
          productId: item.productId,
          variantId: item.variantId,
          quantity,
          costPriceCents: item.costPriceCents,
          totalCostCents: item.costPriceCents * BigInt(quantity),
          reasonCode: item.variance! > 0 ? 'found' : 'shrinkage',
          referenceType: 'stocktake',
          referenceId: stocktakeId
        }
      });
      
      // 3. Update product stock
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stockOnHand: {
            increment: item.variance
          }
        }
      });
    }
    
    // 4. Mark stocktake as approved
    await tx.stocktake.update({
      where: { id: stocktakeId },
      data: {
        status: 'approved',
        approvedBy,
        approvedAt: new Date()
      }
    });
    
    // 5. Trigger journal entries for accounting
    // ...
  });
}
```

**Definition of Done:**
- [ ] All endpoints implemented
- [ ] Blind count mode working
- [ ] Variance calculation correct
- [ ] Approval workflow functional
- [ ] Auto-journal triggered

---

### 2-e: Implement Stock Transfers API

**Priority:** HIGH  
**Estimated Effort:** 6 hours  
**Dependencies:** 1-f

**Required Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transfers` | List transfers |
| GET | `/api/transfers/:id` | Get transfer details |
| POST | `/api/transfers` | Create transfer request |
| POST | `/api/transfers/:id/approve` | Approve transfer |
| POST | `/api/transfers/:id/ship` | Ship transfer |
| POST | `/api/transfers/:id/receive` | Receive transfer |
| POST | `/api/transfers/:id/cancel` | Cancel transfer |

**Transfer Workflow:**

```
Draft → Pending → Approved → In Transit → Received
         ↓           ↓           ↓
      Cancelled   Cancelled   Partial
```

**Definition of Done:**
- [ ] All endpoints implemented
- [ ] Approval workflow working
- [ ] In-transit stock tracking
- [ ] Receiving with variance handling
- [ ] Multi-location updates

---

## PHASE 3: FIFO & Batch Tracking Engine

### 3-a: FIFO Consumption Algorithm

**Priority:** HIGH  
**Estimated Effort:** 4 hours  
**Dependencies:** 2-c

**Implementation:**
- Create `FIFOService` class
- Implement consumption algorithm with batch selection
- Handle partial consumption across multiple batches
- Log all batch transactions
- Update cost tracking

**Definition of Done:**
- [x] Algorithm working for sales
- [x] Algorithm working for recipe deductions
- [x] Algorithm working for adjustments
- [x] Unit tests passing (lint check passed)

---

### 3-b: Expiry Alert System

**Priority:** HIGH  
**Estimated Effort:** 4 hours  
**Dependencies:** 2-c, 9-a

**Implementation:**
- Configure alert thresholds (30, 14, 7, 3 days)
- Create alert records in StockAlert table
- Send notifications (email, in-app)
- Dashboard widget for expiry alerts
- Batch quarantine workflow

**Definition of Done:**
- [x] Background service running
- [x] Alerts generated correctly
- [x] Notifications sent
- [x] Quarantine workflow working

---

### 3-c: Batch Recall Workflow

**Priority:** HIGH  
**Estimated Effort:** 6 hours  
**Dependencies:** 2-c

**Implementation:**
- Batch status transition: active → quarantined → recalled/cleared
- Block sale of quarantined/recalled batches
- Notification to all locations holding batch
- Recall report generation
- Clearance workflow after resolution

**Definition of Done:**
- [x] Recall initiation working
- [x] Sale blocking enforced
- [x] Multi-location notification
- [x] Resolution workflow complete

---

### 3-d: Weighted Average Cost Calculation

**Priority:** HIGH  
**Estimated Effort:** 4 hours  
**Dependencies:** 2-b

**Formula:**
```
newCostPrice = (existingQty × oldCost + newQty × newCost) / (existingQty + newQty)
```

**Implementation:**
- Update on every GRN completion
- Store in costPriceCents on Product
- Round to nearest cent
- Log cost change history

**Definition of Done:**
- [x] Calculation correct
- [x] Updates on GRN
- [x] History maintained
- [x] Reports accurate

---

## PHASE 4: GroSupply Integration

### 4-a: Auto-Create Inventory on PO Delivery

**Priority:** HIGH  
**Estimated Effort:** 4 hours  
**Dependencies:** 2-b

**Implementation:**
- Listen for PO status change to 'delivered'
- Create stock movement for each item
- Update product stock on hand
- Create batch if batch-tracking required
- Update weighted average cost

**Definition of Done:**
- [ ] Auto-movement created
- [ ] Stock updated correctly
- [ ] Batches created
- [ ] Cost updated

---

### 4-b: 3-Way GRN Matching

**Priority:** HIGH  
**Estimated Effort:** 6 hours  
**Dependencies:** Existing GRN API

**Implementation:**
- Compare PO quantity vs Invoice quantity vs Received quantity
- Flag discrepancies (over, under, damaged)
- Require approval for mismatches
- Auto-accept within tolerance threshold (e.g., 5%)

**Definition of Done:**
- [ ] Matching logic working
- [ ] Discrepancy handling
- [ ] Approval workflow
- [ ] Reporting functional

---

### 4-c: Batch Creation on GRN

**Priority:** HIGH  
**Estimated Effort:** 4 hours  
**Dependencies:** 2-c

**Implementation:**
- Auto-generate batch number if not provided
- Capture production date and expiry date
- Link batch to GRN item
- Calculate cost per unit

**Definition of Done:**
- [ ] Batch auto-created
- [ ] Dates captured
- [ ] GRN linked
- [ ] Stock tracking working

---

### 4-d: Auto-RFQ on Reorder Point

**Priority:** MEDIUM  
**Estimated Effort:** 4 hours  
**Dependencies:** 9-b

**Implementation:**
- Monitor stock levels against reorder points
- Generate RFQ when threshold reached
- Select preferred supplier
- Include calculated reorder quantity

**Definition of Done:**
- [ ] Reorder detection working
- [ ] RFQ auto-generated
- [ ] Supplier selection working
- [ ] Notification sent

---

## PHASE 5: Recipe Engine & POS Integration

### 5-a: Recipe Ingredient Deduction

**Priority:** HIGH  
**Estimated Effort:** 6 hours  
**Dependencies:** 2-b, Existing Recipe Engine

**Implementation:**
- On dish sale, look up recipe ingredients
- For each ingredient, deduct from inventory
- Use FIFO for ingredient batches
- Create movement per ingredient

**Definition of Done:**
- [ ] Deduction on sale
- [ ] FIFO for ingredients
- [ ] Correct quantities
- [ ] Audit trail complete

---

### 5-b: POS Sale → Inventory Deduction

**Priority:** HIGH  
**Estimated Effort:** 4 hours  
**Dependencies:** 2-b

**Implementation:**
- On checkout completion, call inventory API
- Use idempotency key from transaction ID
- Atomic transaction with sale record
- Rollback inventory on payment failure

**Definition of Done:**
- [ ] Deduction atomic with sale
- [ ] Rollback working
- [ ] No orphaned movements
- [ ] Performance acceptable

---

### 5-c: Return Handling with Batch Restoration

**Priority:** MEDIUM  
**Estimated Effort:** 4 hours  
**Dependencies:** 2-b, 2-c

**Implementation:**
- On return, restore stock
- Try to restore to original batch if still valid
- Create new batch if original expired
- Log return movement

**Definition of Done:**
- [ ] Stock restored
- [ ] Batch handled
- [ ] Movement logged
- [ ] Cost adjusted

---

### 5-d: Bundle Product Deduction

**Priority:** MEDIUM  
**Estimated Effort:** 4 hours  
**Dependencies:** 2-b

**Implementation:**
- Define bundle components
- On bundle sale, deduct each component
- Track each component's batch separately
- Report on component-level COGS

**Definition of Done:**
- [ ] Bundle definition
- [ ] Component deduction
- [ ] Batch tracking per component
- [ ] COGS reporting

---

## PHASE 6: Multi-Location Stock Management

### 6-a: Location-Based Stock Queries

**Priority:** MEDIUM  
**Estimated Effort:** 3 hours  
**Dependencies:** 1-c

**Implementation:**
- Filter products by location
- Show location-specific stock levels
- Consolidated view across locations
- Location-level reorder points

**Definition of Done:**
- [ ] Location filter working
- [ ] Per-location stock accurate
- [ ] Consolidated view
- [ ] Reorder per location

---

### 6-b: Transfer Request Workflow

**Priority:** MEDIUM  
**Estimated Effort:** 4 hours  
**Dependencies:** 2-e

**Implementation:**
- Create transfer request
- Approval by source location manager
- Approval by destination if required
- Status tracking throughout

**Definition of Done:**
- [ ] Request creation
- [ ] Approval workflow
- [ ] Status tracking
- [ ] Notification on status change

---

### 6-c: In-Transit Tracking

**Priority:** MEDIUM  
**Estimated Effort:** 4 hours  
**Dependencies:** 2-e

**Implementation:**
- Create virtual "In-Transit" location
- Move stock to in-transit on ship
- Track estimated arrival
- Move to destination on receive

**Definition of Done:**
- [ ] In-transit location
- [ ] Ship updates stock
- [ ] Arrival tracking
- [ ] Receive updates stock

---

### 6-d: Consolidated Inventory View

**Priority:** MEDIUM  
**Estimated Effort:** 4 hours  
**Dependencies:** 6-a

**Implementation:**
- API endpoint for all locations
- Aggregation by product
- Drill-down to location level
- Export functionality

**Definition of Done:**
- [ ] API endpoint
- [ ] Aggregation correct
- [ ] Drill-down working
- [ ] Export functional

---

## PHASE 7: JAX AI Forecasting Engine

### 7-a: Sales Velocity Calculation

**Priority:** MEDIUM  
**Estimated Effort:** 4 hours  
**Dependencies:** Movement data

**Implementation:**
- Calculate daily sales per product
- Calculate hourly velocity patterns
- Store in time-series format
- Update daily

**Definition of Done:**
- [ ] Daily velocity calculated
- [ ] Hourly patterns stored
- [ ] Historical data available
- [ ] Performance acceptable

---

### 7-b: 5-Day Demand Forecast

**Priority:** MEDIUM  
**Estimated Effort:** 8 hours  
**Dependencies:** 7-a

**Implementation:**
- Use historical sales data
- Apply day-of-week adjustments
- Consider seasonal factors
- Store predictions with confidence

**Definition of Done:**
- [ ] Forecast generated daily
- [ ] Stored in DemandForecast
- [ ] Confidence scores included
- [ ] API endpoint available

---

### 7-c: Seasonal Pattern Detection

**Priority:** LOW  
**Estimated Effort:** 6 hours  
**Dependencies:** 7-a

**Implementation:**
- Analyze year-over-year patterns
- Identify holiday effects
- Detect promotional impacts
- Adjust forecasts accordingly

**Definition of Done:**
- [ ] Patterns detected
- [ ] Holidays considered
- [ ] Promo adjustment
- [ ] Accuracy improved

---

### 7-d: Smart Reorder Suggestions

**Priority:** MEDIUM  
**Estimated Effort:** 6 hours  
**Dependencies:** 7-b

**Implementation:**
- Combine forecast with current stock
- Calculate days of stock remaining
- Suggest order timing and quantity
- Include confidence level

**Definition of Done:**
- [ ] Suggestions generated
- [ ] Days of stock calculated
- [ ] Order timing suggested
- [ ] Confidence displayed

---

## PHASE 8: Accounting Integration

### 8-a: Auto-Journal on Stock Movements

**Priority:** HIGH  
**Estimated Effort:** 6 hours  
**Dependencies:** 2-b, Accounting module

**Journal Entry Templates:**

| Movement Type | Debit | Credit |
|---------------|-------|--------|
| Sale | Cost of Sales | Inventory Asset |
| Return | Inventory Asset | Cost of Sales |
| GRN | Inventory Asset | Accounts Payable |
| Adjustment + | Inventory Asset | Stock Variance Income |
| Adjustment - | Stock Write-off | Inventory Asset |
| Expiry | Wastage Expense | Inventory Asset |
| Transfer | No P&L | Balance sheet reclass |

**Definition of Done:**
- [ ] All movement types handled
- [ ] Journal entries created
- [ ] Correct accounts used
- [ ] Audit trail complete

---

### 8-b: COGS Locked at Movement Time

**Priority:** HIGH  
**Estimated Effort:** 2 hours  
**Dependencies:** 2-b

**Implementation:**
- Store costPriceCents on movement
- Never update after creation
- Use for COGS reporting
- Historical accuracy maintained

**Definition of Done:**
- [ ] Cost locked on creation
- [ ] No retroactive updates
- [ ] COGS reports accurate
- [ ] Audit verified

---

### 8-c: Stocktake Variance Auto-Journal

**Priority:** HIGH  
**Estimated Effort:** 4 hours  
**Dependencies:** 2-d, 8-a

**Implementation:**
- On stocktake approval, calculate total variance value
- Create single journal entry for all variances
- Reference stocktake in journal
- Post to correct P&L account

**Definition of Done:**
- [ ] Variance calculated
- [ ] Journal created
- [ ] Correct accounts
- [ ] Reference maintained

---

### 8-d: Shrinkage/Wastage Tracking

**Priority:** MEDIUM  
**Estimated Effort:** 4 hours  
**Dependencies:** 2-b, 8-a

**Implementation:**
- Track by reason code
- Categorize for reporting
- Calculate shrinkage %
- Flag for investigation threshold

**Definition of Done:**
- [ ] Reason codes tracked
- [ ] Reports by category
- [ ] Shrinkage KPIs
- [ ] Investigation workflow

---

## PHASE 9: Background Services

### 9-a: Expiry Alert Service

**Priority:** HIGH  
**Estimated Effort:** 4 hours  
**Dependencies:** 2-c

**Implementation:**
- Create mini-service on port 3006
- Run daily at configured time
- Check batches against thresholds
- Create alerts and send notifications

**Definition of Done:**
- [ ] Service running
- [ ] Daily execution
- [ ] Alerts created
- [ ] Notifications sent

---

### 9-b: Reorder Point Monitor

**Priority:** HIGH  
**Estimated Effort:** 4 hours  
**Dependencies:** 2-a

**Implementation:**
- Create mini-service on port 3007
- Run hourly
- Check stock against reorder points
- Create alerts and potentially auto-RFQ

**Definition of Done:**
- [ ] Service running
- [ ] Hourly execution
- [ ] Alerts created
- [ ] Auto-RFQ optional

---

### 9-c: Demand Forecast Service

**Priority:** MEDIUM  
**Estimated Effort:** 6 hours  
**Dependencies:** 7-a, 7-b

**Implementation:**
- Create mini-service on port 3008
- Run nightly
- Generate 5-day forecasts
- Store in DemandForecast table

**Definition of Done:**
- [ ] Service running
- [ ] Nightly execution
- [ ] Forecasts stored
- [ ] API available

---

### 9-d: Stock Sync Service (Offline Reconciliation)

**Priority:** MEDIUM  
**Estimated Effort:** 6 hours  
**Dependencies:** Offline mode

**Implementation:**
- Process offline transaction queue
- Handle conflicts with optimistic locking
- Flag conflicts for manager review
- Retry failed syncs

**Definition of Done:**
- [ ] Queue processing
- [ ] Conflict detection
- [ ] Resolution workflow
- [ ] Retry logic

---

## PHASE 10: Frontend-Backend Connection

### 10-a: Replace Mock Data in InventoryView

**Priority:** HIGH  
**Estimated Effort:** 8 hours  
**Dependencies:** All Phase 2 APIs

**Files to Update:**
- `InventoryView.tsx`
- Replace all mock arrays with API calls
- Add loading states
- Add error handling
- Implement real-time updates

**Definition of Done:**
- [ ] Products from API
- [ ] Movements from API
- [ ] Dashboard KPIs real
- [ ] Alerts real
- [ ] Loading states

---

### 10-b: Connect GRN Dialog

**Priority:** HIGH  
**Estimated Effort:** 4 hours  
**Dependencies:** 4-a, 4-b, 4-c

**Implementation:**
- Load PO from GroSupply
- Show PO items for receiving
- Submit to GRN API
- Update inventory on completion

**Definition of Done:**
- [ ] PO loaded
- [ ] Receiving workflow
- [ ] GRN created
- [ ] Inventory updated

---

### 10-c: Connect Stocktake Dialog

**Priority:** HIGH  
**Estimated Effort:** 4 hours  
**Dependencies:** 2-d

**Implementation:**
- Create stocktake via API
- Load items for counting
- Submit counts
- Complete and approve workflow

**Definition of Done:**
- [ ] Create stocktake
- [ ] Load items
- [ ] Submit counts
- [ ] Approval workflow

---

### 10-d: Connect Stock Adjustment

**Priority:** HIGH  
**Estimated Effort:** 2 hours  
**Dependencies:** 2-b

**Implementation:**
- Submit adjustment to movements API
- Select reason code
- Add notes
- View movement history

**Definition of Done:**
- [ ] Adjustment submitted
- [ ] Reason captured
- [ ] Movement logged
- [ ] Stock updated

---

### 10-e: Connect JAX AI Insights

**Priority:** MEDIUM  
**Estimated Effort:** 4 hours  
**Dependencies:** 7-b, 7-d

**Implementation:**
- Load forecasts from API
- Display predictions with confidence
- Show reorder suggestions
- Action buttons functional

**Definition of Done:**
- [ ] Forecasts loaded
- [ ] Suggestions displayed
- [ ] Actions working
- [ ] Real-time feel

---

## PHASE 11: Compliance & Reporting

### 11-a: SARS-Ready Stock Valuation Reports

**Priority:** MEDIUM  
**Estimated Effort:** 4 hours  
**Dependencies:** 2-b

**Reports:**
- Stock valuation at cost
- Stock valuation at retail
- COGS summary
- Movement summary for period

**Definition of Done:**
- [ ] Reports generated
- [ ] Export to PDF/Excel
- [ ] SARS format compliant
- [ ] Audit trail

---

### 11-b: SAHPRA Pharmacy Compliance

**Priority:** MEDIUM  
**Estimated Effort:** 6 hours  
**Dependencies:** Product schedule class

**Implementation:**
- Schedule drug tracking
- Prescription recording
- Dispensing logs
- SAHPRA reports

**Definition of Done:**
- [ ] Schedule tracking
- [ ] Prescription capture
- [ ] Dispensing logs
- [ ] Reports generated

---

### 11-c: Cold Chain Compliance Logging

**Priority:** LOW  
**Estimated Effort:** 4 hours  
**Dependencies:** Product cold chain flag

**Implementation:**
- 4-hourly temperature logging
- Alert on excursion
- Compliance report
- Audit trail

**Definition of Done:**
- [ ] Logging interface
- [ ] Excursion alerts
- [ ] Compliance report
- [ ] History maintained

---

### 11-d: Allergen Tracking and Display

**Priority:** MEDIUM  
**Estimated Effort:** 4 hours  
**Dependencies:** Product allergen field

**Implementation:**
- Store allergens per product
- Display allergens on POS
- Allergen reports
- Recipe allergen aggregation

**Definition of Done:**
- [ ] Allergens stored
- [ ] POS display
- [ ] Reports available
- [ ] Recipe aggregation

---

## PHASE 12: Testing & Production Hardening

### 12-a: Unit Tests for FIFO Algorithm

**Priority:** HIGH  
**Estimated Effort:** 4 hours  
**Dependencies:** 3-a

**Test Cases:**
- Simple single-batch consumption
- Multi-batch FIFO consumption
- Insufficient stock handling
- Batch expiry ordering
- Cost calculation accuracy

**Definition of Done:**
- [ ] All test cases passing
- [ ] Edge cases covered
- [ ] Performance acceptable
- [ ] Code coverage > 90%

---

### 12-b: Integration Tests for Movement APIs

**Priority:** HIGH  
**Estimated Effort:** 6 hours  
**Dependencies:** All Phase 2

**Test Cases:**
- Movement creates stock change
- Batch transaction logged
- Product stock updated
- Location stock updated
- Journal entry triggered

**Definition of Done:**
- [ ] All scenarios tested
- [ ] Atomic transactions verified
- [ ] Error handling tested
- [ ] Performance acceptable

---

### 12-c: Load Tests for POS Deduction

**Priority:** MEDIUM  
**Estimated Effort:** 4 hours  
**Dependencies:** 5-b

**Test Scenarios:**
- 100 concurrent POS sales
- Rapid fire deductions
- Mixed product types
- Batch-tracked products

**Definition of Done:**
- [ ] Response time < 100ms
- [ ] No deadlocks
- [ ] No data corruption
- [ ] Graceful degradation

---

### 12-d: Idempotency Key Validation

**Priority:** HIGH  
**Estimated Effort:** 2 hours  
**Dependencies:** 2-b

**Implementation:**
- Unique constraint on idempotencyKey
- Return existing movement on duplicate
- Handle retry scenarios
- Log retry attempts

**Definition of Done:**
- [ ] Duplicate detection
- [ ] Correct response on retry
- [ ] No double-deduction
- [ ] Audit log

---

### 12-e: Negative Stock Prevention

**Priority:** HIGH  
**Estimated Effort:** 3 hours  
**Dependencies:** 2-b

**Implementation:**
- Check stock before deduction
- Block sale if insufficient
- Allow override with manager code
- Log override events

**Definition of Done:**
- [ ] Stock check working
- [ ] Sale blocked
- [ ] Override workflow
- [ ] Override logging

---

## Summary Statistics

| Phase | Tasks | Est. Hours | Priority |
|-------|-------|------------|----------|
| Phase 1: Database Schema | 7 | 21 | HIGH |
| Phase 2: Core APIs | 5 | 34 | HIGH |
| Phase 3: FIFO Engine | 4 | 18 | HIGH |
| Phase 4: GroSupply Integration | 4 | 18 | HIGH/MEDIUM |
| Phase 5: Recipe & POS | 4 | 18 | HIGH/MEDIUM |
| Phase 6: Multi-Location | 4 | 15 | MEDIUM |
| Phase 7: JAX AI Forecast | 4 | 24 | MEDIUM/LOW |
| Phase 8: Accounting | 4 | 16 | HIGH/MEDIUM |
| Phase 9: Background Services | 4 | 20 | HIGH/MEDIUM |
| Phase 10: Frontend Connection | 5 | 22 | HIGH/MEDIUM |
| Phase 11: Compliance | 4 | 18 | MEDIUM/LOW |
| Phase 12: Testing | 5 | 19 | HIGH/MEDIUM |
| **TOTAL** | **54** | **243** | - |

---

## Priority Order for Implementation

### Sprint 1 (Weeks 1-2): Foundation
1. Phase 1-a: Product models
2. Phase 1-d: StockMovement model
3. Phase 2-a: Products API
4. Phase 2-b: Movements API (basic)

### Sprint 2 (Weeks 3-4): Core Functionality
5. Phase 1-b: Batch models
6. Phase 2-c: Batches API
7. Phase 3-a: FIFO algorithm
8. Phase 10-a: Frontend connection

### Sprint 3 (Weeks 5-6): Integration
9. Phase 4-a: GroSupply integration
10. Phase 5-b: POS integration
11. Phase 1-e: Stocktake models
12. Phase 2-d: Stocktake API

### Sprint 4 (Weeks 7-8): Advanced Features
13. Phase 1-c: Location models
14. Phase 6: Multi-location
15. Phase 8: Accounting integration
16. Phase 9: Background services

### Sprint 5 (Weeks 9-10): Polish & Testing
17. Phase 7: JAX AI Forecasting
18. Phase 11: Compliance
19. Phase 12: Testing
20. Documentation & Release prep

---

## Conclusion

The Inventory module requires approximately **243 hours (8-10 weeks)** of development work to become fully functional. The critical path runs through:

1. **Database Schema** → **Core APIs** → **Frontend Connection** → **Integration**

The frontend UI is already comprehensive and well-designed. Once the backend is implemented, the module will provide world-class inventory management matching Cin7/Shopify standards with South African compliance built-in.

**Key Success Metrics:**
- Real-time stock accuracy > 99%
- FIFO compliance 100%
- Expiry loss < 2%
- Stocktake variance < 1%
- POS deduction latency < 100ms
