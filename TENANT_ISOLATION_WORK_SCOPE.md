# Tenant Isolation & Currency Fix - Work Scope

## Executive Summary
This document outlines the comprehensive refactoring required to:
1. Remove all USD ($) currency symbols and replace with ZAR (R)
2. Eliminate hardcoded mock data for new tenants
3. Implement proper tenant data isolation
4. Enable admin console support for tenant management

---

## Phase 1: Currency Standardization (HIGH PRIORITY)

### Files Requiring Currency Fix
| File | Issue | Action |
|------|-------|--------|
| `ChildcareView.tsx` | `formatCurrency` uses `$` | Change to `R` |
| All view components | Hardcoded `$` amounts | Replace with `R` |
| API routes | USD references | Change to ZAR |

### Implementation
```typescript
// BEFORE
const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`

// AFTER
const formatCurrency = (amount: number) => `R${amount.toLocaleString('en-ZA')}`
```

---

## Phase 2: Mock Data Removal (HIGH PRIORITY)

### Problem
All view components have hardcoded `generateMock*()` functions that show fake data to new tenants.

### Components with Mock Data
1. `ChildcareView.tsx` - Children, classes, fees, attendance
2. `AccountingView.tsx` - Accounts, invoices, bills
3. `InventoryView.tsx` - Products, batches, movements
4. `CRMView.tsx` - Customers, purchases, messages
5. `MarketingView.tsx` - Campaigns, templates
6. `VouchersAndGiftCardsView.tsx` - Cards, vouchers
7. `StaffHRMView.tsx` - Employees, shifts, commissions
8. `HotelManagementView.tsx` - Rooms, reservations
9. `HealthBeautyView.tsx` - Appointments, treatments
10. `ProfessionalComplianceView.tsx` - Matters, compliance
11. `AutoRepairView.tsx` - Job cards, vehicles
12. `FuneralServicesView.tsx` - Packages, deceased records
13. `DryCleaningView.tsx` - Orders, deliveries
14. `ArchitectureView.tsx` - Projects, drawings
15. `EngineeringView.tsx` - Projects, timesheets
16. `QuantitySurveyingView.tsx` - Projects, BOQ
17. `MedicalPracticeView.tsx` - Patients, appointments
18. `DentalPracticeView.tsx` - Patients, treatments
19. `RealEstateView.tsx` - Properties, deals
20. +30 more vertical views

### Solution Pattern
1. Create API endpoint for each data type
2. Fetch data based on `merchantId` from session
3. Show empty state UI when no data exists
4. Allow user to add their own data

---

## Phase 3: Tenant Data Isolation Architecture

### Current State
- Components generate mock data locally
- No tenant context propagation
- API routes may use hardcoded defaults

### Target State
```
┌─────────────────────────────────────────────────────────┐
│                    Session Context                       │
│  - userId: string                                        │
│  - merchantId: string                                    │
│  - branchId: string                                      │
│  - role: string                                          │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    API Routes                            │
│  - Extract merchantId from session                      │
│  - Query ONLY that merchant's data                      │
│  - Return empty arrays for new tenants                  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Frontend Views                        │
│  - Fetch from API                                       │
│  - Show empty state if no data                          │
│  - Enable user to create data                           │
└─────────────────────────────────────────────────────────┘
```

### Required Utilities

#### 1. `useMerchantData` Hook
```typescript
// src/app/merchant-os/app/hooks/useMerchantData.ts
export function useMerchantData<T>(
  endpoint: string,
  options?: { autoFetch?: boolean }
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const session = useSession() // Get merchantId from session

  const fetch = async () => {
    if (!session?.merchantId) return
    setLoading(true)
    try {
      const res = await fetch(`${endpoint}?merchantId=${session.merchantId}`)
      const json = await res.json()
      setData(json.data || [])
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, refetch: fetch }
}
```

#### 2. Empty State Components
```typescript
// src/components/EmptyState.tsx
export function EmptyState({ 
  title, 
  description, 
  action, 
  icon 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-4 max-w-sm">{description}</p>
      {action}
    </div>
  )
}
```

---

## Phase 4: Admin Console Enhancements

### Required Features
1. **Tenant List View** - All merchants with status
2. **Tenant Detail View** - Full merchant profile
3. **Support Actions**
   - View tenant's data
   - Impersonate tenant (for support)
   - Reset tenant configuration
   - View audit logs
4. **Tenant Health Dashboard**
   - Active sessions
   - Error logs
   - Subscription status

---

## Implementation Priority

### Sprint 1 (Critical - This Session)
- [ ] Fix currency symbols across all views
- [ ] Create `useMerchantData` hook
- [ ] Create EmptyState component
- [ ] Refactor ChildcareView as reference implementation

### Sprint 2 (Next)
- [ ] Create API endpoints for all vertical data
- [ ] Refactor remaining 20+ views
- [ ] Remove all mock data generators

### Sprint 3 (Final)
- [ ] Admin console tenant management
- [ ] Support impersonation feature
- [ ] Audit logging for tenant actions

---

## Testing Checklist
- [ ] New tenant registration shows empty states
- [ ] Currency displays as R (ZAR)
- [ ] Data created by tenant persists correctly
- [ ] Admin can view tenant data
- [ ] No cross-tenant data leakage

---

*Document Version: 1.0*
*Last Updated: 2025-04-20*
