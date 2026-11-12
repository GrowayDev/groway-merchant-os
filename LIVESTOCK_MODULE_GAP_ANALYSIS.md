# Leruo Agricultural Produce - Livestock Management Module
## Gap Analysis & Future-Proofing Report

**Version:** 1.0  
**Date:** January 2025  
**Module:** 13th Vertical - Agriculture (Livestock Sub-module)

---

## Executive Summary

This document provides a comprehensive gap analysis between the current Agriculture vertical implementation and the specified Livestock Management Module requirements. The analysis covers all 14 agriculture sub-verticals with focus on the Livestock module (Cattle, Pigs, Sheep, Goats, Poultry) and identifies enhancement opportunities for future-proofing.

**Current Implementation Status:** ~15% of spec requirements met  
**Recommendation:** Major architectural enhancement required

---

## 1. Current State Analysis

### 1.1 Existing Database Models

| Model | Status | Gap Assessment |
|-------|--------|----------------|
| `Farm` | ✅ Basic | Missing: farm certifications tracking, multiple farm locations |
| `Livestock` | ⚠️ Partial | Missing: lifecycle stages, breeding status, batch tracking, system mode |
| `CropField` | ✅ Basic | N/A for livestock |
| `FarmCompliance` | ✅ Basic | Missing: automated reminders, expiry alerts |
| `HealthRecord` | ⚠️ Partial | Missing: vaccination schedules, treatment protocols |
| `MovementRecord` | ⚠️ Partial | Missing: system transitions (grazing→feedlot), camp/pen allocation |

### 1.2 Missing Database Models (Critical)

| Required Model | Purpose | Priority |
|----------------|---------|----------|
| `AnimalUnit` | Unified individual/batch tracking | P0 |
| `Breed` | Breed management with performance metrics | P0 |
| `LifecycleStage` | Configurable lifecycle per species | P0 |
| `BreedingRecord` | Mating, pregnancy, birth tracking | P0 |
| `OffspringRecord` | Birth outcomes, dam/sire linkage | P0 |
| `WeightRecord` | Weight history with estimation support | P1 |
| `CampPen` | Camp/pen management with capacity | P1 |
| `GrazingAssessment` | Grass condition monitoring | P2 |
| `FeedRecord` | Feed consumption and conversion | P1 |
| `MortalityRecord` | Death tracking with cause analysis | P1 |
| `VaccinationSchedule` | Vaccination calendar and reminders | P1 |
| `AnimalPhoto` | Photo storage for AI weight estimation | P2 |

---

## 2. Spec Requirement Gap Analysis

### 2.1 Core Design Principles - Gap Assessment

#### 2.1.1 Dual Production Capability ❌ NOT IMPLEMENTED
| Requirement | Current State | Gap |
|-------------|---------------|-----|
| Breeding operations (genetics, reproduction) | No model | Need BreedingRecord, OffspringRecord |
| Commercial operations (growth, feed, sales) | Basic Livestock model | Missing feed tracking, sales integration |

#### 2.1.2 Dual Tracking Capability ❌ NOT IMPLEMENTED
| Requirement | Current State | Gap |
|-------------|---------------|-----|
| Individual animal tracking | Basic `Livestock` model | Needs unique ID, RFID, ear tag support |
| Batch/group tracking | Not supported | Need AnimalUnit with tracking_type field |

#### 2.1.3 Multi-System Farming Support ❌ NOT IMPLEMENTED
| Requirement | Current State | Gap |
|-------------|---------------|-----|
| Grazing (extensive) | Not tracked | Need system_type field, camp allocation |
| Feedlot (intensive) | Not tracked | Need pen allocation, feed tracking |
| Hybrid (transition) | Not tracked | Need movement records with system transitions |

---

### 2.2 Master Data Structure Gaps

#### 2.2.1 Animal Unit Data Fields - Required vs Current

| Required Field | Current Implementation | Status |
|----------------|----------------------|--------|
| Unit_ID | `id` (auto-generated) | ✅ |
| Tracking_Type | ❌ Missing | 🔴 |
| Species | `animalType` | ✅ |
| Breed | `breed` (basic string) | ⚠️ Needs Breed model |
| Production_Type | ❌ Missing | 🔴 |
| System_Type | ❌ Missing | 🔴 |
| Lifecycle_Stage | ❌ Missing | 🔴 |
| Gender | `gender` | ✅ |
| Identification | `identificationNumber` | ✅ |
| Weight_Current | `weightCurrent` | ✅ |
| Health_Status | `healthStatus` | ✅ |
| Purpose | `purpose` | ✅ |

**Gap Summary:** 5 of 12 core fields missing (42% gap)

#### 2.2.2 Breed Management - NOT IMPLEMENTED

**Current State:** Breed is a simple string field on Livestock model

**Required Features:**
- Multiple breeds per species ❌
- Crossbreed support (e.g., Boer × Kalahari Red) ❌
- Performance comparison by breed:
  - Growth rate ❌
  - Fertility ❌
  - Feed efficiency ❌

---

### 2.3 Lifecycle Management Engine - NOT IMPLEMENTED

#### 2.3.1 Species Lifecycle Configurations

**Current State:** No lifecycle stage tracking

**Required Configurations:**

| Species | Required Stages | Current Implementation |
|---------|----------------|----------------------|
| Cattle | Calf → Weaner → Heifer/Steer → Breeder/Finisher | ❌ None |
| Pigs | Piglet → Weaner → Grower → Finisher → Vors | ❌ None |
| Sheep | Lamb → Weaner → Grower → Finisher → Ewe/Ram | ❌ None |
| Goats | Kid → Weaner → Grower → Finisher → Doe/Buck | ❌ None |
| Poultry | Chick → Grower → Layer/Broiler | ❌ None |

#### 2.3.2 Vors Classification (Pig-Specific) - NOT IMPLEMENTED

**Requirements:**
- Manual or rule-based classification (age threshold, reproductive inactivity) ❌
- Trigger separate pricing models ❌
- Cull classification ❌
- Dedicated reporting ❌

---

### 2.4 Breeding Management System - NOT IMPLEMENTED

#### 2.4.1 Breeding Profiles

**Required for:** Cows, Sows, Ewes, Does

| Required Field | Current State |
|----------------|---------------|
| Breeding status (open, pregnant, lactating) | ❌ Missing |
| Mating date | ❌ Missing |
| Sire identification | ❌ Missing |
| Expected birth date | ❌ Missing |
| Actual birth date | ❌ Missing |

#### 2.4.2 Offspring Management

| Requirement | Current State |
|-------------|---------------|
| Auto-generate animal records at birth | ❌ Not implemented |
| Link offspring to dam and sire | ❌ Not implemented |
| Record number born/alive | ❌ Not implemented |
| Record birth weights (AI estimation) | ❌ Not implemented |

#### 2.4.3 Reproduction KPIs - NOT IMPLEMENTED

| KPI | Calculation Support |
|-----|---------------------|
| Conception rate | ❌ No breeding data |
| Lambing/kidding rate | ❌ No breeding data |
| Litter size (pigs) | ❌ No breeding data |
| Twinning rate (sheep/goats) | ❌ No breeding data |
| Weaning success rate | ❌ No breeding data |
| Age at First Calving/Kidding/Lambing | ❌ No breeding data |
| Inter-Calving/Kidding/Lambing Period | ❌ No breeding data |

---

### 2.5 Grazing, Feedlot & Movement Tracking - PARTIALLY IMPLEMENTED

#### 2.5.1 System Modes

| Mode | Current Support |
|------|-----------------|
| Grazing | ❌ Not tracked |
| Supplemented Grazing | ❌ Not tracked |
| Feedlot | ❌ Not tracked |

#### 2.5.2 Movement Tracking

| Requirement | Current State |
|-------------|---------------|
| Movement between systems | ⚠️ Basic MovementRecord exists |
| Date of movement | ✅ Has `movementDate` |
| Weight at movement | ❌ Missing |
| Location (camp/pen) | ⚠️ Has `fromLocation`, `toLocation` |

#### 2.5.3 Camp & Pen Management - NOT IMPLEMENTED

| Requirement | Status |
|-------------|--------|
| Camp/paddock allocation | ❌ Not implemented |
| Pen allocation | ❌ Not implemented |
| Capacity limits | ❌ Not implemented |
| **Grass condition assessment (AI camera)** | ❌ Not implemented |

---

### 2.6 Weight & Growth Tracking Engine - PARTIALLY IMPLEMENTED

#### 2.6.1 Weight Capture Methods

| Method | Current Support |
|--------|-----------------|
| Manual input | ✅ `weightCurrent` field |
| Scale integration | ❌ Not implemented |
| **Camera-based estimation (AI)** | ❌ Not implemented |

#### 2.6.2 Camera-Based Weight Estimation - NOT IMPLEMENTED

**Required Features:**
- Capture image/video via mobile device ❌
- Estimate body dimensions ❌
- Predict live weight using AI models ❌
- Store images linked to animal records ❌
- Allow manual override ❌
- Maintain weight history ❌

#### 2.6.3 Growth Calculations

| Calculation | Current Support |
|-------------|-----------------|
| Average Daily Gain (ADG) | ❌ No weight history |
| Weight gain per lifecycle stage | ❌ No lifecycle stages |
| Growth trends | ❌ No historical data |

---

### 2.7 Mortality & Health Management - PARTIALLY IMPLEMENTED

#### 2.7.1 Mortality Tracking

| Requirement | Current State |
|-------------|---------------|
| Record cause of death | ⚠️ Can be stored in notes |
| Lifecycle stage at death | ❌ No lifecycle stages |
| Mortality rates per batch/species | ❌ No batch tracking |

#### 2.7.2 Health Records

| Feature | Current State |
|---------|---------------|
| Vaccinations | ⚠️ Basic HealthRecord exists |
| Treatments | ✅ Has treatment field |
| Disease tracking | ⚠️ Basic support |
| Vaccination schedules | ❌ Not implemented |
| Vaccination reminders | ❌ Not implemented |

---

### 2.8 Animal Classification System - PARTIALLY IMPLEMENTED

| Classification | Current Support |
|----------------|-----------------|
| Breeding stock | ⚠️ Via `purpose` field |
| Commercial stock | ⚠️ Via `purpose` field |
| Replacement stock | ❌ Not explicitly tracked |
| Cull animals | ❌ Not explicitly tracked |

---

### 2.9 Goat & Sheep Productivity Layer - NOT IMPLEMENTED

| Feature | Status |
|---------|--------|
| Offspring per female per year | ❌ Not tracked |
| Survival rate to weaning | ❌ Not tracked |
| Growth performance (grazing vs feedlot) | ❌ Not tracked |
| Breeding calendars | ❌ Not implemented |
| Lambing/kidding windows | ❌ Not implemented |
| Mating period alerts | ❌ Not implemented |
| Expected birth alerts | ❌ Not implemented |

---

### 2.10 User Interface Requirements - PARTIALLY IMPLEMENTED

#### 2.10.1 Dashboard Views

| View | Current State |
|------|---------------|
| Species-level dashboard | ❌ Not implemented |
| Batch-level dashboard | ❌ Not implemented |
| Individual animal profile | ⚠️ Basic placeholder exists |

#### 2.10.2 Quick Actions

| Action | Current State |
|--------|---------------|
| Add animal/batch | ⚠️ Button exists, no dialog |
| Record weight | ❌ Not implemented |
| Record birth | ❌ Not implemented |
| Record death | ❌ Not implemented |
| Move animals | ❌ Not implemented |

---

### 2.11 Automation & Alerts - NOT IMPLEMENTED

| Alert Type | Status |
|------------|--------|
| Animals due to give birth | ❌ Not implemented |
| Underperforming growth rates | ❌ Not implemented |
| High mortality events | ❌ Not implemented |
| Animals reaching sale weight | ❌ Not implemented |
| Reproductive delays | ❌ Not implemented |
| Vaccination due | ❌ Not implemented |
| Compliance expiry | ❌ Not implemented |

---

### 2.12 Reporting Outputs - NOT IMPLEMENTED

| Report | Status |
|--------|--------|
| Herd/flock structure reports | ❌ Not implemented |
| Growth performance reports | ❌ Not implemented |
| Reproduction performance reports | ❌ Not implemented |
| Mortality analysis | ❌ Not implemented |
| Breed performance comparison | ❌ Not implemented |
| Feed conversion reports | ❌ Not implemented |

---

## 3. Enhancement Recommendations for Future-Proofing

### 3.1 AI Integration Opportunities

#### 3.1.1 AI Weight Estimation System (Spec Requirement)
```
┌─────────────────────────────────────────────────────────────┐
│                    AI WEIGHT ESTIMATION                      │
├─────────────────────────────────────────────────────────────┤
│  Camera Input → Body Detection → Dimension Estimation       │
│       ↓              ↓                    ↓                 │
│  Image Store    AI Model (VLM)    Weight Prediction         │
│       ↓              ↓                    ↓                 │
│  Reference      Confidence %      Weight Range              │
│  Object         Validation        Manual Override           │
└─────────────────────────────────────────────────────────────┘
```

**Implementation Approach:**
1. Use VLM (Vision Language Model) skill for image analysis
2. Train on species-specific body condition scoring
3. Reference object detection for scale calibration
4. Confidence scoring with manual override option

#### 3.1.2 Grass Condition Assessment (Spec Requirement)
```
┌─────────────────────────────────────────────────────────────┐
│                   GRASS CONDITION AI                         │
├─────────────────────────────────────────────────────────────┤
│  Drone/Camera Image → Vegetation Analysis                   │
│         ↓                    ↓                              │
│   NDVI Estimation     Grass Height Detection                │
│         ↓                    ↓                              │
│   Biomass Estimate    Grazing Days Remaining                │
│         ↓                    ↓                              │
│   Camp Rotation       Stocking Density Alerts               │
└─────────────────────────────────────────────────────────────┘
```

**Implementation Approach:**
1. Use satellite imagery API (Sentinel-2) for NDVI
2. Mobile camera for ground-truth validation
3. Calculate grazing capacity based on:
   - Grass species composition
   - Rainfall data integration
   - Animal unit equivalents

#### 3.1.3 Disease Early Warning System
- Symptom recognition via image analysis
- Historical pattern matching
- Weather-based disease risk prediction
- Integration with veterinary services

### 3.2 IoT Integration Opportunities

#### 3.2.1 RFID/Ear Tag Integration
```
┌─────────────────────────────────────────────────────────────┐
│                    RFID INTEGRATION                          │
├─────────────────────────────────────────────────────────────┤
│  RFID Reader → Animal ID → Database Lookup → Display        │
│       ↓           ↓            ↓              ↓             │
│  Weight Scale  Auto-Log    Health Status   Mobile App       │
│  Integration   Movement    Breeding Data   Notifications    │
└─────────────────────────────────────────────────────────────┘
```

#### 3.2.2 Smart Scale Integration
- Bluetooth/wifi enabled livestock scales
- Automatic weight recording
- Real-time ADG calculation
- Anomaly detection (weight loss alerts)

#### 3.2.3 Environmental Sensors
- Temperature/humidity monitoring
- Water trough level sensors
- Feed bin level monitoring
- Weather station integration

### 3.3 Blockchain & Traceability

#### 3.3.1 Farm-to-Fork Traceability
```
┌─────────────────────────────────────────────────────────────┐
│                   TRACEABILITY CHAIN                         │
├─────────────────────────────────────────────────────────────┤
│  Birth → Vaccinations → Movements → Feeding → Processing    │
│   ↓         ↓            ↓          ↓          ↓            │
│  Block    Block        Block      Block      Block          │
│  Chain    Chain        Chain      Chain      Chain          │
│   ↓         ↓            ↓          ↓          ↓            │
│  QR Code for Consumer Transparency                          │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 Mobile App Strategy

#### 3.4.1 Field Operations App
- Offline-first design for remote farms
- Photo capture for AI analysis
- Voice-to-text for quick notes
- GPS-tagged camp assessments

#### 3.4.2 PWA Implementation
- Progressive Web App for cross-platform
- Background sync for offline data
- Push notifications for alerts
- Camera API for weight estimation

### 3.5 Integration Opportunities

#### 3.5.1 Market Price Integration
- Real-time auction prices (SASPO, Vleissentraal)
- Feed price monitoring
- Input cost tracking
- Profitability calculator

#### 3.5.2 Weather Integration
- South African Weather Service API
- Rainfall tracking per camp
- Drought early warning
- Grazing capacity adjustment

#### 3.5.3 Financial Integration
- Cost per animal tracking
- Revenue per batch
- Profitability by breed/species
- Integration with accounting systems

---

## 4. Recommended Implementation Phases

### Phase 1: Foundation (Weeks 1-4)
**Priority: P0 - Critical**

| Task | Effort | Dependencies |
|------|--------|--------------|
| Create AnimalUnit model | 2 days | None |
| Create Breed model | 1 day | None |
| Create LifecycleStage model | 2 days | AnimalUnit |
| Create BreedingRecord model | 2 days | AnimalUnit |
| Create OffspringRecord model | 1 day | BreedingRecord |
| Implement batch vs individual tracking | 3 days | AnimalUnit |
| Build species-level dashboard | 3 days | All models |
| Implement add animal/batch UI | 3 days | AnimalUnit |

**Deliverables:**
- AnimalUnit with dual tracking capability
- Basic breeding records
- Species dashboard
- Add animal functionality

### Phase 2: Core Features (Weeks 5-8)
**Priority: P1 - High**

| Task | Effort | Dependencies |
|------|--------|--------------|
| Create WeightRecord model | 1 day | AnimalUnit |
| Implement weight history tracking | 2 days | WeightRecord |
| Create CampPen model | 1 day | None |
| Implement movement tracking | 2 days | CampPen |
| Create FeedRecord model | 2 days | AnimalUnit |
| Implement feed tracking | 3 days | FeedRecord |
| Create MortalityRecord model | 1 day | AnimalUnit |
| Implement mortality tracking | 2 days | MortalityRecord |
| Build reproduction KPIs | 3 days | BreedingRecord |
| Implement vaccination schedules | 2 days | HealthRecord |

**Deliverables:**
- Complete weight tracking with history
- Camp/pen management
- Feed consumption tracking
- Mortality analysis
- Reproduction metrics
- Vaccination calendar

### Phase 3: AI & Automation (Weeks 9-12)
**Priority: P2 - Medium**

| Task | Effort | Dependencies |
|------|--------|--------------|
| Integrate VLM for image analysis | 3 days | VLM Skill |
| Build weight estimation UI | 3 days | VLM integration |
| Implement grass condition AI | 5 days | VLM integration |
| Build alert engine | 3 days | All tracking models |
| Implement notification system | 2 days | Alert engine |
| Build reporting dashboard | 5 days | All models |
| Weather API integration | 2 days | None |
| Market price integration | 2 days | None |

**Deliverables:**
- AI weight estimation (beta)
- Grass condition assessment (beta)
- Alert system
- Notifications
- Reports
- External API integrations

### Phase 4: Advanced Features (Weeks 13-16)
**Priority: P3 - Enhancement**

| Task | Effort | Dependencies |
|------|--------|--------------|
| RFID integration framework | 5 days | Hardware partners |
| Scale integration | 3 days | Hardware partners |
| Blockchain traceability | 5 days | Phase 1-3 |
| Mobile PWA optimization | 5 days | Phase 1-3 |
| Offline mode enhancement | 3 days | PWA |
| Financial tracking | 5 days | All models |

**Deliverables:**
- IoT integrations
- Blockchain traceability
- Mobile-optimized experience
- Financial analytics

---

## 5. Database Schema Recommendations

### 5.1 Core Models (New)

```prisma
// Unified Animal Unit - supports individual and batch tracking
model AnimalUnit {
  id                  String   @id @default(cuid())
  unitCode            String   @unique  // Human-readable code
  trackingType        TrackingType  // INDIVIDUAL | BATCH
  species             Species
  breedId             String?
  breed               Breed?   @relation(fields: [breedId], references: [id])
  
  // Production & System
  productionType      ProductionType  // BREEDING | COMMERCIAL
  systemType          SystemType      // GRAZING | FEEDLOT | HYBRID
  
  // Current State
  lifecycleStageId    String?
  lifecycleStage      LifecycleStage? @relation(fields: [lifecycleStageId], references: [id])
  classification      AnimalClassification  // BREEDING_STOCK | COMMERCIAL | REPLACEMENT | CULL
  
  // Batch Fields (for batch tracking)
  batchQuantity       Int?
  batchStartDate      DateTime?
  
  // Individual Fields
  identificationNumber String?  @unique  // Ear tag, RFID
  gender              Gender?
  birthDate           DateTime?
  damId               String?   // Mother
  sireId              String?   // Father
  
  // Location
  currentCampId       String?
  currentCamp         CampPen? @relation(fields: [currentCampId], references: [id])
  
  // Status
  status              AnimalStatus  @default(ACTIVE)
  healthStatus        HealthStatus  @default(HEALTHY)
  
  // Weight
  currentWeight       Float?
  weightUnit          WeightUnit   @default(KG)
  
  // Timestamps
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  acquiredAt          DateTime?
  
  // Relations
  weightRecords       WeightRecord[]
  healthRecords       HealthRecord[]
  movements           MovementRecord[]
  breedingRecordsAsDam  BreedingRecord[] @relation("DamBreeding")
  breedingRecordsAsSire BreedingRecord[] @relation("SireBreeding")
  offspringRecords    OffspringRecord[]
  feedRecords         FeedRecord[]
  mortalityRecord     MortalityRecord?
  photos              AnimalPhoto[]
  
  farmId              String
  farm                Farm     @relation(fields: [farmId], references: [id])
  
  @@index([species, status])
  @@index([farmId, species])
}

enum TrackingType {
  INDIVIDUAL
  BATCH
}

enum Species {
  CATTLE
  PIG
  SHEEP
  GOAT
  POULTRY
  HORSE      // For equine sub-vertical
  GAME       // For game farming
}

enum ProductionType {
  BREEDING
  COMMERCIAL
}

enum SystemType {
  GRAZING
  SUPPLEMENTED_GRAZING
  FEEDLOT
  HYBRID
}

enum AnimalClassification {
  BREEDING_STOCK
  COMMERCIAL_STOCK
  REPLACEMENT_STOCK
  CULL
  VORS  // Pigs only - older animals for lower-grade market
}

enum Gender {
  MALE
  FEMALE
  CASTRATED_MALE
}

enum AnimalStatus {
  ACTIVE
  SOLD
  DECEASED
  TRANSFERRED
}

enum HealthStatus {
  HEALTHY
  SICK
  RECOVERING
  QUARANTINE
}

enum WeightUnit {
  KG
  LB
}

// Breed Management
model Breed {
  id              String   @id @default(cuid())
  name            String
  species         Species
  isCrossbreed    Boolean  @default(false)
  parentBreeds    String?  // JSON array for crossbreeds
  
  // Performance benchmarks
  avgBirthWeight  Float?
  avgMatureWeight Float?
  avgADG          Float?   // Average Daily Gain (kg/day)
  avgFertility    Float?   // Percentage
  avgFeedConversion Float?
  
  description     String?
  
  animals         AnimalUnit[]
  
  @@unique([name, species])
}

// Configurable Lifecycle Stages
model LifecycleStage {
  id              String   @id @default(cuid())
  species         Species
  name            String   // e.g., "Calf", "Weaner", "Finisher"
  sequence        Int      // Order in lifecycle
  
  // Transition rules
  minAgeDays      Int?
  minWeight       Float?
  autoTransition  Boolean  @default(false)
  
  // Duration
  typicalDuration Int?     // Days
  
  animals         AnimalUnit[]
  
  @@unique([species, sequence])
  @@unique([species, name])
}

// Camp and Pen Management
model CampPen {
  id              String   @id @default(cuid())
  code            String   // e.g., "CAMP-A1", "PEN-12"
  name            String
  type            CampPenType  // CAMP | PEN
  capacity        Int      // Animal units
  
  // Location
  section         String?  // Farm section
  areaHectares    Float?   // For camps
  
  // Grass Assessment (for camps)
  lastAssessmentDate DateTime?
  grassCondition   Float?  // Score 1-10
  grazingDaysRemaining Int?
  biomassEstimate  Float?  // kg/ha
  
  // Current occupancy
  currentOccupancy Int     @default(0)
  
  status          CampPenStatus @default(ACTIVE)
  
  animals         AnimalUnit[]
  movements       MovementRecord[]
  
  farmId          String
  farm            Farm     @relation(fields: [farmId], references: [id])
  
  @@unique([farmId, code])
}

enum CampPenType {
  CAMP
  PADDOCK
  PEN
  KRAAL
}

enum CampPenStatus {
  ACTIVE
  INACTIVE
  MAINTENANCE
  RESTING  // For camps being rested
}
```

### 5.2 Breeding Models (New)

```prisma
// Breeding Records
model BreedingRecord {
  id              String   @id @default(cuid())
  
  // Animals
  damId           String
  dam             AnimalUnit @relation("DamBreeding", fields: [damId], references: [id])
  sireId          String?
  sire            AnimalUnit? @relation("SireBreeding", fields: [sireId], references: [id])
  aiUsed          Boolean  @default(false)  // Artificial Insemination
  
  // Breeding Status
  status          BreedingStatus @default(MATED)
  matingDate      DateTime
  
  // Pregnancy
  pregnancyCheckDate DateTime?
  pregnancyResult  Boolean?
  expectedBirthDate DateTime?
  
  // Birth
  actualBirthDate DateTime?
  birthComplications String?
  
  // Offspring summary
  offspringBorn   Int?
  offspringAlive  Int?
  
  notes           String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  offspring       OffspringRecord[]
  
  farmId          String
  farm            Farm     @relation(fields: [farmId], references: [id])
  
  @@index([damId, status])
  @@index([farmId, matingDate])
}

enum BreedingStatus {
  MATED
  PREGNANT
  BIRTHED
  FAILED
  ABORTED
}

// Offspring Records
model OffspringRecord {
  id              String   @id @default(cuid())
  
  breedingRecordId String
  breedingRecord   BreedingRecord @relation(fields: [breedingRecordId], references: [id])
  
  // Individual offspring
  animalId        String?  // If tracked individually
  animal          AnimalUnit? @relation(fields: [animalId], references: [id])
  
  // Birth details
  birthOrder      Int?     // 1, 2, 3 for multiples
  birthWeight     Float?
  gender          Gender?
  
  // Status
  status          OffspringStatus @default(ALIVE)
  deathDate       DateTime?
  deathCause      String?
  
  createdAt       DateTime @default(now())
}

enum OffspringStatus {
  ALIVE
  STILLBORN
  DIED
  SOLD
}
```

### 5.3 Weight & Growth Models (New)

```prisma
// Weight Records
model WeightRecord {
  id              String   @id @default(cuid())
  
  animalId        String
  animal          AnimalUnit @relation(fields: [animalId], references: [id])
  
  weight          Float
  weightUnit      WeightUnit @default(KG)
  
  // Capture method
  method          WeightMethod @default(MANUAL)
  
  // AI Estimation
  imageId         String?  // Reference to AnimalPhoto
  confidenceLevel Float?   // % confidence for AI estimates
  estimatedRange  String?  // JSON: { min: 100, max: 120 }
  
  // Conditions
  bodyConditionScore Int?   // 1-9 scale
  
  // Calculations (populated by system)
  daysSinceLast   Int?
  weightGain      Float?
  adg             Float?   // Average Daily Gain
  
  weighedAt       DateTime @default(now())
  notes           String?
  
  @@index([animalId, weighedAt])
}

enum WeightMethod {
  MANUAL
  SCALE
  AI_ESTIMATION
}

// Animal Photos (for AI analysis)
model AnimalPhoto {
  id              String   @id @default(cuid())
  
  animalId        String
  animal          AnimalUnit @relation(fields: [animalId], references: [id])
  
  imageUrl        String
  thumbnailUrl    String?
  
  // Image metadata
  capturedAt      DateTime @default(now())
  capturedBy      String?  // User ID
  
  // AI Analysis
  analysisStatus  AnalysisStatus @default(PENDING)
  estimatedWeight Float?
  confidenceLevel Float?
  bodyConditionScore Int?
  analysisResult  String?  // JSON with full analysis
  
  // Reference object (for scale)
  hasReferenceObject Boolean @default(false)
  referenceType   String?  // "A4_PAPER", "MEASURING_STICK", etc.
  
  @@index([animalId, capturedAt])
}

enum AnalysisStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

### 5.4 Feed & Mortality Models (New)

```prisma
// Feed Records
model FeedRecord {
  id              String   @id @default(cuid())
  
  // Can be for individual or batch
  animalId        String?
  animal          AnimalUnit? @relation(fields: [animalId], references: [id])
  batchId         String?  // Alternative: feed a whole camp
  
  // Feed details
  feedType        String   // "HAY", "CONCENTRATE", "PASTURE", etc.
  feedName        String?
  quantity        Float
  unit            FeedUnit
  
  // Cost
  costPerUnit     Float?
  totalCost       Float?
  
  // Nutrition (optional)
  proteinContent  Float?
  energyContent   Float?
  
  fedAt           DateTime @default(now())
  notes           String?
  
  campId          String?
  camp            CampPen? @relation(fields: [campId], references: [id])
  
  farmId          String
  farm            Farm     @relation(fields: [farmId], references: [id])
  
  @@index([animalId, fedAt])
}

enum FeedUnit {
  KG
  TONNE
  BALES
  LITRES
}

// Mortality Records
model MortalityRecord {
  id              String   @id @default(cuid())
  
  animalId        String   @unique
  animal          AnimalUnit @relation(fields: [animalId], references: [id])
  
  // Death details
  deathDate       DateTime @default(now())
  deathCause      String?
  deathCategory   DeathCategory?
  
  // For batch deaths
  quantity        Int      @default(1)  // For batch tracking
  
  // Investigation
  postMortemDone  Boolean  @default(false)
  postMortemNotes String?
  veterinarianId  String?
  
  // Disposal
  disposalMethod  DisposalMethod?
  disposalDate    DateTime?
  
  // Insurance
  insuranceClaim  Boolean  @default(false)
  claimNumber     String?
  claimAmount     Float?
  
  notes           String?
  
  farmId          String
  farm            Farm     @relation(fields: [farmId], references: [id])
  
  @@index([farmId, deathDate])
}

enum DeathCategory {
  DISEASE
  PREDATION
  ACCIDENT
  OLD_AGE
  UNKNOWN
  CULLING
}

enum DisposalMethod {
  BURIAL
  BURNING
  RENDERING
  COMPOSTING
}
```

### 5.5 Vaccination Schedule Model (New)

```prisma
// Vaccination Schedules
model VaccinationSchedule {
  id              String   @id @default(cuid())
  
  name            String
  species         Species
  disease         String
  
  // Schedule
  firstDoseAge    Int      // Days
  boosterInterval Int?     // Days between boosters
  numberOfDoses   Int      @default(1)
  
  // Administration
  route           String?  // "IM", "SC", "ORAL"
  dosage          Float?
  unit            String?
  
  description     String?
  
  // Reminders
  reminderDaysBefore Int?  @default(7)
  
  records         VaccinationRecord[]
  
  farmId          String
  farm            Farm     @relation(fields: [farmId], references: [id])
  
  @@unique([farmId, name, species])
}

// Vaccination Records
model VaccinationRecord {
  id              String   @id @default(cuid())
  
  scheduleId      String?
  schedule        VaccinationSchedule? @relation(fields: [scheduleId], references: [id])
  
  animalId        String?
  animal          AnimalUnit? @relation(fields: [animalId], references: [id])
  batchId         String?  // For batch vaccination
  
  // Administration
  vaccineName     String
  batchNumber     String?
  expiryDate      DateTime?
  
  administeredAt  DateTime @default(now())
  administeredBy  String?  // User ID
  nextDueDate     DateTime?
  
  // Cost
  costPerDose     Float?
  totalCost       Float?
  
  notes           String?
  
  farmId          String
  farm            Farm     @relation(fields: [farmId], references: [id])
  
  @@index([animalId, administeredAt])
}
```

---

## 6. API Endpoints Required

### 6.1 Animal Unit APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/merchant-os/agriculture/animals` | List all animal units with filters |
| GET | `/api/merchant-os/agriculture/animals/:id` | Get single animal unit |
| POST | `/api/merchant-os/agriculture/animals` | Create animal unit |
| PATCH | `/api/merchant-os/agriculture/animals/:id` | Update animal unit |
| DELETE | `/api/merchant-os/agriculture/animals/:id` | Delete/deactivate animal unit |
| POST | `/api/merchant-os/agriculture/animals/batch` | Batch create/update |

### 6.2 Breeding APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/merchant-os/agriculture/breeding` | List breeding records |
| GET | `/api/merchant-os/agriculture/breeding/:id` | Get breeding record |
| POST | `/api/merchant-os/agriculture/breeding` | Create breeding record |
| PATCH | `/api/merchant-os/agriculture/breeding/:id` | Update breeding record |
| GET | `/api/merchant-os/agriculture/breeding/kpis` | Get reproduction KPIs |

### 6.3 Weight APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/merchant-os/agriculture/weights` | List weight records |
| POST | `/api/merchant-os/agriculture/weights` | Record weight |
| POST | `/api/merchant-os/agriculture/weights/estimate` | AI weight estimation |
| GET | `/api/merchant-os/agriculture/weights/history/:animalId` | Weight history |

### 6.4 Camp/Pen APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/merchant-os/agriculture/camps` | List camps/pens |
| POST | `/api/merchant-os/agriculture/camps` | Create camp/pen |
| PATCH | `/api/merchant-os/agriculture/camps/:id` | Update camp/pen |
| POST | `/api/merchant-os/agriculture/camps/:id/assess` | Grass assessment |

### 6.5 Health APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/merchant-os/agriculture/health` | List health records |
| POST | `/api/merchant-os/agriculture/health` | Create health record |
| GET | `/api/merchant-os/agriculture/vaccinations` | List vaccinations |
| POST | `/api/merchant-os/agriculture/vaccinations` | Record vaccination |
| GET | `/api/merchant-os/agriculture/vaccinations/schedule` | Vaccination schedule |

### 6.6 Reporting APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/merchant-os/agriculture/reports/herd-structure` | Herd structure report |
| GET | `/api/merchant-os/agriculture/reports/growth` | Growth performance |
| GET | `/api/merchant-os/agriculture/reports/reproduction` | Reproduction metrics |
| GET | `/api/merchant-os/agriculture/reports/mortality` | Mortality analysis |
| GET | `/api/merchant-os/agriculture/reports/dashboard` | Dashboard data |

---

## 7. UI Component Requirements

### 7.1 Dashboard Components

1. **SpeciesDashboard** - Overview per species
2. **HerdStructureWidget** - Visual breakdown
3. **BreedingCalendarWidget** - Upcoming births
4. **AlertsWidget** - Active alerts
5. **WeatherWidget** - Current conditions
6. **MarketPricesWidget** - Commodity prices

### 7.2 Animal Management Components

1. **AnimalUnitForm** - Create/edit animal/batch
2. **AnimalProfileView** - Individual animal details
3. **AnimalListView** - Table with filters
4. **WeightRecordingDialog** - Record weight
5. **MovementDialog** - Move between camps/systems
6. **HealthRecordDialog** - Add health record
7. **MortalityDialog** - Record death

### 7.3 Breeding Components

1. **BreedingRecordForm** - Create breeding record
2. **PregnancyCheckDialog** - Record pregnancy check
3. **BirthRecordingDialog** - Record births
4. **BreedingKPIDashboard** - Reproduction metrics

### 7.4 Camp Management Components

1. **CampOverviewMap** - Visual camp layout
2. **CampDetailsCard** - Camp info with occupancy
3. **GrassAssessmentForm** - Record grass condition
4. **CampRotationPlanner** - Rotation schedule

### 7.5 Reporting Components

1. **ReportGenerator** - Create custom reports
2. **ReportExportDialog** - Export options
3. **ReportChartComponents** - Various chart types

---

## 8. Risk Assessment & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| AI weight estimation accuracy | Medium | High | Manual override, confidence thresholds, training data |
| Offline data sync conflicts | Medium | Medium | Conflict resolution logic, timestamp-based merging |
| Large farm data volume | High | Medium | Pagination, lazy loading, data archiving |
| IoT integration complexity | Medium | Low | Start with manual entry, gradual automation |
| User adoption resistance | Medium | High | Training, simple UI, mobile-first design |

---

## 9. Success Metrics

### 9.1 Phase 1 Metrics
- 100% of new animals tracked in system
- Lifecycle stages configured for all 5 species
- Breeding records created for all breeding females

### 9.2 Phase 2 Metrics
- Weight tracking compliance > 90%
- Vaccination compliance > 95%
- Movement records for all system transitions

### 9.3 Phase 3 Metrics
- AI weight estimation accuracy > 85%
- Alert response time < 24 hours
- User satisfaction score > 4.0/5.0

---

## 10. Conclusion

The current Agriculture vertical implementation provides basic livestock tracking but requires significant enhancement to meet the specified Livestock Management Module requirements. The recommended phased approach prioritizes:

1. **Foundation** - Unified AnimalUnit model with dual tracking
2. **Core Features** - Breeding, weight, health, and movement tracking
3. **AI & Automation** - Weight estimation, grass assessment, alerts
4. **Advanced** - IoT integration, traceability, mobile optimization

The gap analysis reveals a 42% gap in core data fields and approximately 85% of spec features not yet implemented. However, the existing infrastructure (Next.js, Prisma, shadcn/ui) provides a solid foundation for rapid development.

**Recommended Next Steps:**
1. Review and approve database schema changes
2. Begin Phase 1 development with AnimalUnit model
3. Establish AI integration using existing VLM skill
4. Create mobile-responsive UI components
5. Implement alert and notification infrastructure

---

**Document Prepared By:** AI Analysis System  
**Review Status:** Ready for Technical Review  
**Approval Required From:** Product Owner, Technical Lead
